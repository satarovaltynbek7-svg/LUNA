import uuid

from django.db import models


class OrderStatusField(models.CharField):
    def get_placeholder(self, value, compiler, connection):
        if connection.vendor == "postgresql":
            return '%s::"OrderStatus"'
        return "%s"


class MenuCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.CharField(max_length=60, unique=True)
    names = models.JSONField()
    sort_order = models.IntegerField(default=0, db_column="sortOrder")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        managed = False
        db_table = "MenuCategory"
        ordering = ["sort_order", "slug"]

    def __str__(self):
        return self.slug


class MenuItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.CharField(max_length=80, unique=True)
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.DO_NOTHING,
        db_column="categoryId",
        related_name="items",
    )
    names = models.JSONField()
    descriptions = models.JSONField()
    price = models.IntegerField()
    image_url = models.CharField(max_length=2048, db_column="imageUrl")
    is_popular = models.BooleanField(default=False, db_column="isPopular")
    active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0, db_column="sortOrder")
    created_at = models.DateTimeField(auto_now_add=True, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        managed = False
        db_table = "MenuItem"
        ordering = ["sort_order", "slug"]

    def __str__(self):
        return self.slug


class CafeOrder(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "New"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PREPARING = "PREPARING", "Preparing"
        READY = "READY", "Ready"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(null=True, blank=True, db_column="userId")
    table_number = models.IntegerField(null=True, blank=True, db_column="tableNumber")
    customer_name = models.CharField(
        max_length=100, null=True, blank=True, db_column="customerName"
    )
    customer_phone = models.CharField(
        max_length=24, null=True, blank=True, db_column="customerPhone"
    )
    address = models.CharField(max_length=300, null=True, blank=True)
    note = models.CharField(max_length=500, null=True, blank=True)
    status = OrderStatusField(max_length=12, choices=Status.choices, default=Status.NEW)
    total = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True, db_column="createdAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="updatedAt")

    class Meta:
        managed = False
        db_table = "CafeOrder"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.id} · {self.status}"


class OrderLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        CafeOrder,
        on_delete=models.CASCADE,
        db_column="orderId",
        related_name="lines",
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="menuItemId",
    )
    item_names = models.JSONField(db_column="itemNames")
    unit_price = models.IntegerField(db_column="unitPrice")
    quantity = models.IntegerField()
    line_total = models.IntegerField(db_column="lineTotal")

    class Meta:
        managed = False
        db_table = "OrderLine"

    def __str__(self):
        return f"{self.quantity} × {self.menu_item_id}"
