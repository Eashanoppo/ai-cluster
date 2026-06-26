from django.db import models

class WorkloadPlacement(models.Model):
    objects = models.Manager()
    job_id = models.CharField(max_length=100)
    source_node = models.CharField(max_length=100)
    target_node = models.CharField(max_length=100)
    reason = models.TextField()
    migrated_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='PENDING')

    def __str__(self):
        return f"{self.job_id}: {self.source_node} -> {self.target_node}"
