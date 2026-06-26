from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CostReportViewSet

router = DefaultRouter()
router.register(r'reports', CostReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
