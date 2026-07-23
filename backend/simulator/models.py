"""
Simulator app models.

SimulationRun — one complete simulation session (task config + tier choice + AI report).
"""

from django.db import models


class SimulationRun(models.Model):
    """Records a single cluster simulation run submitted from the Workstation."""

    TASK_CHOICES = [
        ('ocr_data_retrieval', 'OCR & Data Retrieval'),
        ('image_generation', 'Image Generation'),
        ('batch_vision', 'Batch Vision Processing'),
        ('image_editing', 'Image Editing'),
        ('large_ml_project', 'Large ML Project'),
        ('video_generation', 'Video Generation'),
        ('code_edit', 'Code Editing'),
        ('production_saas', 'Production SaaS Workload'),
        ('normal_chats', 'Normal Chats'),
    ]

    STATUS_CHOICES = [
        ('analyzing', 'Being Analyzed'),
        ('processing', 'In Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    VERDICT_CHOICES = [
        ('optimal', 'Optimal'),
        ('overload', 'Overload'),
        ('idle_waste', 'Idle Waste'),
    ]

    # Task configuration
    task_type = models.CharField(max_length=32, choices=TASK_CHOICES)
    user_count = models.IntegerField(default=1)
    file_input_size_gb = models.FloatField(default=1.0)
    image_count = models.IntegerField(default=0)
    thinking_depth = models.IntegerField(default=1)  # 1–5
    complexity_factor = models.FloatField(default=1.0)  # 1.0–5.0

    # Phase 7: Workload Engine Metadata
    company_name = models.CharField(max_length=255, blank=True, default="Default AI Co")
    priority = models.CharField(max_length=50, choices=[
        ('Critical', 'Critical'),
        ('High', 'High'),
        ('Normal', 'Normal'),
        ('Background', 'Background')
    ], default='Normal')


    # Stateful chat fields
    prompt = models.TextField(blank=True)
    response_text = models.TextField(blank=True)
    chat_session_id = models.CharField(max_length=64, blank=True)

    # Allocation decision
    selected_tier = models.IntegerField()  # 1–4
    allocated_nodes = models.IntegerField()  # Requested nodes (1–128)
    allocated_nodes_actual = models.IntegerField(null=True, blank=True)  # Final nodes after auto-scale
    required_nodes = models.IntegerField()

    # Computed workload state
    efficiency_pct = models.FloatField(default=0.0)
    verdict = models.CharField(max_length=16, choices=VERDICT_CHOICES, blank=True)

    # AI analysis output
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='analyzing')
    bottleneck_analysis = models.TextField(blank=True)
    recommendations = models.JSONField(default=list)
    demo_talking_points = models.JSONField(default=list)
    ai_raw_report = models.JSONField(default=dict)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    acknowledged = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"SimRun #{self.pk} — {self.task_type} (Actual Nodes: {self.allocated_nodes_actual}) [{self.status}]"
