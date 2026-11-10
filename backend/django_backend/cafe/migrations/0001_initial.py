import uuid

import cafe.models
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="MenuCategory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("slug", models.CharField(max_length=60, unique=True)),
                ("names", models.JSONField()),
                ("sort_order", models.IntegerField(db_column="sortOrder", default=0)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="createdAt")),
                ("updated_at", models.DateTimeField(auto_now=True, db_column="updatedAt")),
            ],
            options={
                "db_table": "MenuCategory",
                "managed": False,
                "ordering": ["sort_order", "slug"],
            },
        ),
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("slug", models.CharField(max_length=80, unique=True)),
                ("names", models.JSONField()),
                ("descriptions", models.JSONField()),
                ("price", models.IntegerField()),
                ("image_url", models.CharField(db_column="imageUrl", max_length=2048)),
                ("is_popular", models.BooleanField(db_column="isPopular", default=False)),
                ("active", models.BooleanField(default=True)),
                ("sort_order", models.IntegerField(db_column="sortOrder", default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="createdAt")),
                ("updated_at", models.DateTimeField(auto_now=True, db_column="updatedAt")),
                ("category", models.ForeignKey(db_column="categoryId", on_delete=django.db.models.deletion.DO_NOTHING, related_name="items", to="cafe.menucategory")),
            ],
            options={
                "db_table": "MenuItem",
                "managed": False,
                "ordering": ["sort_order", "slug"],
            },
        ),
        migrations.CreateModel(
            name="CafeOrder",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("user_id", models.UUIDField(blank=True, db_column="userId", null=True)),
                ("table_number", models.IntegerField(blank=True, db_column="tableNumber", null=True)),
                ("customer_name", models.CharField(blank=True, db_column="customerName", max_length=100, null=True)),
                ("customer_phone", models.CharField(blank=True, db_column="customerPhone", max_length=24, null=True)),
                ("address", models.CharField(blank=True, max_length=300, null=True)),
                ("note", models.CharField(blank=True, max_length=500, null=True)),
                ("status", cafe.models.OrderStatusField(choices=[("NEW", "New"), ("CONFIRMED", "Confirmed"), ("PREPARING", "Preparing"), ("READY", "Ready"), ("COMPLETED", "Completed"), ("CANCELLED", "Cancelled")], default="NEW", max_length=12)),
                ("total", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="createdAt")),
                ("updated_at", models.DateTimeField(auto_now=True, db_column="updatedAt")),
            ],
            options={
                "db_table": "CafeOrder",
                "managed": False,
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="OrderLine",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("item_names", models.JSONField(db_column="itemNames")),
                ("unit_price", models.IntegerField(db_column="unitPrice")),
                ("quantity", models.IntegerField()),
                ("line_total", models.IntegerField(db_column="lineTotal")),
                ("menu_item", models.ForeignKey(blank=True, db_column="menuItemId", null=True, on_delete=django.db.models.deletion.SET_NULL, to="cafe.menuitem")),
                ("order", models.ForeignKey(db_column="orderId", on_delete=django.db.models.deletion.CASCADE, related_name="lines", to="cafe.cafeorder")),
            ],
            options={
                "db_table": "OrderLine",
                "managed": False,
            },
        ),
    ]
