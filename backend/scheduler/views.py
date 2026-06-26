from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import WorkloadPlacement
from .serializers import WorkloadPlacementSerializer

class SchedulerPagination(PageNumberPagination):
    page_size = 50

class WorkloadPlacementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = WorkloadPlacement.objects.all().order_by('-migrated_at')
    serializer_class = WorkloadPlacementSerializer
    pagination_class = SchedulerPagination
