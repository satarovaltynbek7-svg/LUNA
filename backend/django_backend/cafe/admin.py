from django.contrib import admin

from .models import CafeOrder, MenuCategory, MenuItem, OrderLine


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "active", "sort_order")
    list_filter = ("active",)
    search_fields = ("slug",)
    ordering = ("sort_order", "slug")


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("slug", "category", "price", "is_popular", "active", "sort_order")
    list_filter = ("category", "is_popular", "active")
    search_fields = ("slug",)
    ordering = ("sort_order", "slug")


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0
    can_delete = False
    readonly_fields = ("menu_item", "item_names", "unit_price", "quantity", "line_total")


@admin.register(CafeOrder)
class CafeOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "customer_phone",
        "table_number",
        "status",
        "total",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("customer_name", "customer_phone", "address")
    readonly_fields = ("id", "total", "created_at", "updated_at")
    inlines = (OrderLineInline,)
