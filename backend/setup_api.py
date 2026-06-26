import os

base_dir = "d:/Ai-Cluster/backend"

files = {
    "sentinel/serializers.py": """from rest_framework import serializers
from .models import Prediction, Alert

class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'
""",
    "sentinel/views.py": """from rest_framework import viewsets
from .models import Prediction, Alert
from .serializers import PredictionSerializer, AlertSerializer

class PredictionViewSet(viewsets.ModelViewSet):
    queryset = Prediction.objects.all().order_by('-predicted_at')
    serializer_class = PredictionSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
""",
    "sentinel/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PredictionViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'predictions', PredictionViewSet)
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "scheduler/serializers.py": """from rest_framework import serializers
from .models import WorkloadPlacement

class WorkloadPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkloadPlacement
        fields = '__all__'
""",
    "scheduler/views.py": """from rest_framework import viewsets
from .models import WorkloadPlacement
from .serializers import WorkloadPlacementSerializer

class WorkloadPlacementViewSet(viewsets.ModelViewSet):
    queryset = WorkloadPlacement.objects.all().order_by('-migrated_at')
    serializer_class = WorkloadPlacementSerializer
""",
    "scheduler/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkloadPlacementViewSet

router = DefaultRouter()
router.register(r'placements', WorkloadPlacementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "costwatch/serializers.py": """from rest_framework import serializers
from .models import CostReport

class CostReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostReport
        fields = '__all__'
""",
    "costwatch/views.py": """from rest_framework import viewsets
from .models import CostReport
from .serializers import CostReportSerializer

class CostReportViewSet(viewsets.ModelViewSet):
    queryset = CostReport.objects.all().order_by('-reported_at')
    serializer_class = CostReportSerializer
""",
    "costwatch/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CostReportViewSet

router = DefaultRouter()
router.register(r'reports', CostReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "copilot/views.py": """from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class CopilotQueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '')
        # Mock LLM response for hackathon demo
        if 'performance' in query.lower() or 'down' in query.lower():
            return Response({
                "status": "success",
                "message": "Node-14 is experiencing thermal throttling. Sentinel predicts an 85% chance of failure within 2 hours. I recommend migrating Job-52 to Node-12."
            })
        return Response({
            "status": "success",
            "message": "I am monitoring the cluster. All systems nominal."
        })
""",
    "copilot/urls.py": """from django.urls import path
from .views import CopilotQueryView

urlpatterns = [
    path('query/', CopilotQueryView.as_view(), name='copilot-query'),
]
""",
    "gate/serializers.py": """from rest_framework import serializers
from .models import ApprovalRequest

class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = '__all__'
""",
    "gate/views.py": """from rest_framework import viewsets
from .models import ApprovalRequest
from .serializers import ApprovalRequestSerializer
from rest_framework.permissions import IsAuthenticated

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ApprovalRequest.objects.all().order_by('-requested_at')
    serializer_class = ApprovalRequestSerializer
""",
    "gate/urls.py": """from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApprovalRequestViewSet

router = DefaultRouter()
router.register(r'approvals', ApprovalRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""",
    "neuronops/urls.py": """from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/sentinel/', include('sentinel.urls')),
    path('api/scheduler/', include('scheduler.urls')),
    path('api/costwatch/', include('costwatch.urls')),
    path('api/copilot/', include('copilot.urls')),
    path('api/gate/', include('gate.urls')),
]
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    with open(full_path, 'w') as f:
        f.write(content)
print("API views and serializers generated successfully.")
