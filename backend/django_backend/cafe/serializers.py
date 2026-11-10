import uuid

from django.utils import timezone
from rest_framework import serializers

from .models import CafeOrder, MenuCategory, MenuItem, OrderLine


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ("id", "slug", "names")


class MenuItemSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    image = serializers.CharField(source="image_url", read_only=True)
    isPopular = serializers.BooleanField(source="is_popular", read_only=True)

    class Meta:
        model = MenuItem
        fields = (
            "id",
            "slug",
            "category",
            "names",
            "descriptions",
            "price",
            "image",
            "isPopular",
        )


class OrderItemInputSerializer(serializers.Serializer):
    itemId = serializers.SlugField(max_length=80)
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CustomerOrderSerializer(serializers.Serializer):
    customerName = serializers.CharField(max_length=100, required=False, allow_blank=True)
    customerPhone = serializers.RegexField(
        regex=r"^[0-9+ ]{7,24}$",
        max_length=24,
        required=False,
        allow_blank=True,
    )
    address = serializers.CharField(max_length=300, required=False, allow_blank=True)
    tableNumber = serializers.IntegerField(min_value=1, max_value=999, required=False)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True)
    items = OrderItemInputSerializer(many=True, min_length=1, max_length=50)

    def validate(self, attrs):
        requested = attrs["items"]
        slugs = [line["itemId"] for line in requested]
        if len(set(slugs)) != len(slugs):
            raise serializers.ValidationError(
                {"items": "Each menu item may only appear once."}
            )

        products = {
            item.slug: item
            for item in MenuItem.objects.select_related("category").filter(
                slug__in=slugs,
                active=True,
                category__active=True,
            )
        }
        if len(products) != len(slugs):
            raise serializers.ValidationError(
                {"items": "One or more menu items are no longer available."}
            )

        lines = []
        total = 0
        for line in requested:
            product = products[line["itemId"]]
            line_total = product.price * line["quantity"]
            total += line_total
            lines.append(
                {
                    "product": product,
                    "quantity": line["quantity"],
                    "line_total": line_total,
                }
            )
        if total > 2_147_483_647:
            raise serializers.ValidationError({"items": "Order total is too large."})

        attrs["validated_lines"] = lines
        attrs["calculated_total"] = total
        return attrs

    def create(self, validated_data):
        from django.db import transaction

        order_values = {
            "id": uuid.uuid4(),
            "customer_name": validated_data.get("customerName") or None,
            "customer_phone": validated_data.get("customerPhone") or None,
            "address": validated_data.get("address") or None,
            "table_number": validated_data.get("tableNumber"),
            "note": validated_data.get("note") or None,
            "status": CafeOrder.Status.NEW,
            "total": validated_data["calculated_total"],
            "created_at": timezone.now(),
            "updated_at": timezone.now(),
        }

        with transaction.atomic():
            order = CafeOrder.objects.create(**order_values)
            OrderLine.objects.bulk_create(
                [
                    OrderLine(
                        order=order,
                        menu_item=line["product"],
                        item_names=line["product"].names,
                        unit_price=line["product"].price,
                        quantity=line["quantity"],
                        line_total=line["line_total"],
                    )
                    for line in validated_data["validated_lines"]
                ]
            )
        return order

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "status": instance.status,
            "total": instance.total,
        }
