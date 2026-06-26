from django.db import models

class CostReport(models.Model):
    objects = models.Manager()
    node_id = models.CharField(max_length=100)
    idle_time_hours = models.FloatField()
    wasted_cost_usd = models.DecimalField(max_digits=10, decimal_places=2)
    reported_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.node_id} - ${self.wasted_cost_usd}"
