from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Prediction, Alert
from .serializers import PredictionSerializer, AlertSerializer

class SentinelPagination(PageNumberPagination):
    page_size = 50

class PredictionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Prediction.objects.all().order_by('-predicted_at')
    serializer_class = PredictionSerializer
    pagination_class = SentinelPagination

class AlertViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    pagination_class = SentinelPagination
