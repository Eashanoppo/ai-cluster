"""Simulator app URL configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyProfileViewSet, basename='companyprofile')

urlpatterns = [
    path('', include(router.urls)),
    path("config/", views.simulator_config, name="simulator-config"),
    path("preview/", views.workload_preview, name="simulator-preview"),
    path("runs/", views.simulation_runs, name="simulator-runs"),
    path("runs/<int:pk>/", views.simulation_run_detail, name="simulator-run-detail"),
    path("runs/<int:pk>/acknowledge/", views.acknowledge_run, name="simulator-acknowledge"),
    path("inject_failure/", views.inject_failure, name="simulator-inject-failure"),
    path("scenario/", views.scenario_control, name="simulator-scenario"),
    path("judge_mode/", views.judge_mode, name="simulator-judge-mode"),
    # Tier Fit & Placement Proof (Hackathon Challenge Module)
    path("tier_fit/", views.tier_fit_results, name="simulator-tier-fit"),
    path("workload_burst/", views.workload_burst_trigger, name="simulator-workload-burst"),
]

