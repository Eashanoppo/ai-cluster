from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkloadPlacementViewSet

router = DefaultRouter()
router.register(r'placements', WorkloadPlacementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
