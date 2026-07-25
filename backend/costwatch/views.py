from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from .models import CostReport
from .serializers import CostReportSerializer

class CostWatchPagination(PageNumberPagination):
    page_size = 100

class CostReportViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = CostReport.objects.all().order_by('-reported_at')
    serializer_class = CostReportSerializer
    pagination_class = CostWatchPagination
