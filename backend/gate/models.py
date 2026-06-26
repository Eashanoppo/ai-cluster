from django.db import models
from django.contrib.auth.models import User

class ApprovalRequest(models.Model):
    objects = models.Manager()
    action_type = models.CharField(max_length=100)
    target_resource = models.CharField(max_length=100)
    reason = models.TextField()
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING', db_index=True) # PENDING, APPROVED, REJECTED

    class Meta:
        indexes = [
            models.Index(fields=['target_resource', 'requested_at']),
        ]

    def __str__(self):
        return f"[{self.status}] {self.action_type} on {self.target_resource}"
