from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import GpuTelemetry
from .serializers import GpuTelemetrySerializer

class GpuTelemetryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = GpuTelemetry.objects.all()
    serializer_class = GpuTelemetrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        node_id = self.request.query_params.get('node_id')
        if node_id:
            qs = qs.filter(node_id=node_id)
        
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                # If a limit is specified, we return the sliced list directly
                return qs.order_by('-timestamp')[:int(limit)]
            except ValueError:
                pass
        return qs.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        from django.db.models import Subquery, OuterRef
        latest_telemetry_qs = GpuTelemetry.objects.filter(
            node_id=OuterRef('node_id')
        ).order_by('-timestamp').values('id')[:1]
        
        latest_telemetries = GpuTelemetry.objects.filter(
            id__in=Subquery(latest_telemetry_qs)
        ).order_by('node_id')
        
        serializer = self.get_serializer(latest_telemetries, many=True)
        return Response(serializer.data)
