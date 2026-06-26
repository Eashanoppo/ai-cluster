from django.db import models

class Prediction(models.Model):
    objects = models.Manager()
    node_id = models.CharField(max_length=100)
    failure_probability = models.FloatField()
    predicted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reason = models.TextField()

    def __str__(self):
        return f"{self.node_id} - {float(self.failure_probability)*100:.1f}%"  # type: ignore

class Alert(models.Model):
    objects = models.Manager()
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    node_id = models.CharField(max_length=100)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['node_id', 'resolved']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.node_id}: {self.message}"
