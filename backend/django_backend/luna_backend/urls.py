from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cafe.views import MenuViewSet, OrderViewSet

router = DefaultRouter()
router.register("menu", MenuViewSet, basename="menu")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", lambda request: JsonResponse({"status": "ok"}), name="health"),
    path("api/", include(router.urls)),
]
