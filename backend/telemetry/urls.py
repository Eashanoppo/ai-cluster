from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GpuTelemetryViewSet

router = DefaultRouter()
router.register(r'', GpuTelemetryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
