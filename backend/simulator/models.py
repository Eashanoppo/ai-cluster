"""
Simulator app models.

SimulationRun — one complete simulation session (task config + tier choice + AI report).
"""

from django.db import models


class CompanyProfile(models.Model):
    """Company Wizard settings (Doc 6.9)."""
    name = models.CharField(max_length=255, unique=True)
    industry = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    
    # Business Goals
    goal_cost = models.BooleanField(default=False)
    goal_latency = models.BooleanField(default=False)
    goal_balanced = models.BooleanField(default=True)
    goal_throughput = models.BooleanField(default=False)
    
    # Infrastructure
    initial_gpu_count = models.IntegerField(default=128)
    cpu_nodes = models.IntegerField(default=64)
    budget = models.IntegerField(default=500000)
    
    # Selected Services & Workloads
    services = models.JSONField(default=list)
    allowed_tasks = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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


class TierFitResult(models.Model):
    """
    Records the Tier Fit placement decision for each job dispatched by Ray.
    Stores cost comparison vs naive 'First Free' scheduler and a human-readable reason line.
    Used by the Placement Proof dashboard panel (hackathon challenge deliverable).
    """
    TRAFFIC_MODE_CHOICES = [
        ('peak', 'Peak Hours'),
        ('off_peak', 'Off-Peak'),
        ('manual', 'Manual'),
    ]

    run = models.ForeignKey(
        SimulationRun,
        on_delete=models.CASCADE,
        related_name='tier_fit_results',
        null=True, blank=True
    )
    task_type = models.CharField(max_length=64)
    selected_tier = models.IntegerField()
    tier_name = models.CharField(max_length=100)

    # Tier Fit Score: 0-100 (100 = perfect cheapest-viable match)
    tier_fit_score = models.FloatField(default=0.0)

    # Human-readable reason line (one sentence)
    reason_line = models.TextField(blank=True)

    # Cost of our CustroConnect placement
    cost_per_hour_usd = models.FloatField(default=0.0)

    # What a naive "first free" scheduler would have chosen
    first_free_tier = models.IntegerField(default=1)
    first_free_cost_usd = models.FloatField(default=0.0)
    cost_saving_usd = models.FloatField(default=0.0)

    # Wait times (simulated, in seconds)
    wait_time_seconds = models.FloatField(default=0.0)
    first_free_wait_seconds = models.FloatField(default=0.0)

    # Was Tier 4 (Blackwell B200) kept free for heavy jobs?
    top_tier_preserved = models.BooleanField(default=False)

    # Traffic mode when this job was generated
    traffic_mode = models.CharField(
        max_length=16,
        choices=TRAFFIC_MODE_CHOICES,
        default='manual'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['run', '-created_at']),
            models.Index(fields=['task_type', '-created_at']),
        ]

    def __str__(self):
        return f"TierFit #{self.pk} — {self.task_type} → Tier {self.selected_tier} (score={self.tier_fit_score:.0f}) saved ${self.cost_saving_usd:.2f}"
