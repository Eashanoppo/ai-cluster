from django.urls import path
from .views import CopilotQueryView

urlpatterns = [
    path('query/', CopilotQueryView.as_view(), name='copilot-query'),
]
