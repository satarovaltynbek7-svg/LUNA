from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MenuCategory, MenuItem
from .serializers import (
    CustomerOrderSerializer,
    MenuCategorySerializer,
    MenuItemSerializer,
)


class MenuViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    queryset = MenuItem.objects.select_related("category").filter(
        active=True, category__active=True
    )

    def list(self, request, *args, **kwargs):
        categories = MenuCategory.objects.filter(active=True).order_by(
            "sort_order", "slug"
        )
        items = self.filter_queryset(self.get_queryset()).order_by(
            "sort_order", "slug"
        )
        return Response(
            {
                "categories": MenuCategorySerializer(categories, many=True).data,
                "items": self.get_serializer(items, many=True).data,
            }
        )


class OrderViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = CustomerOrderSerializer
    permission_classes = [AllowAny]
    http_method_names = ["post", "options", "head"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            {"order": serializer.data},
            status=status.HTTP_201_CREATED,
        )
