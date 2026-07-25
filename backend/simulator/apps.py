"""Simulator Django app config."""

from django.apps import AppConfig


class SimulatorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "simulator"
    verbose_name = "Cluster Simulator"
