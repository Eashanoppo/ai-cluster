from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PredictionViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'predictions', PredictionViewSet)
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
