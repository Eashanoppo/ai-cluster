"""Simulator app URL configuration."""

from django.urls import path
from . import views

urlpatterns = [
    path("config/", views.simulator_config, name="simulator-config"),
    path("preview/", views.workload_preview, name="simulator-preview"),
    path("runs/", views.simulation_runs, name="simulator-runs"),
    path("runs/<int:pk>/", views.simulation_run_detail, name="simulator-run-detail"),
    path("runs/<int:pk>/acknowledge/", views.acknowledge_run, name="simulator-acknowledge"),
    path("inject_failure/", views.inject_failure, name="simulator-inject-failure"),
]
