from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

class Company(models.Model):
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    budget_limit_usd = models.FloatField(default=10000.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=50, choices=[('admin', 'Admin'), ('operator', 'Operator'), ('viewer', 'Viewer')], default='viewer')
    
    # Resolve reverse accessor clashes
    groups = models.ManyToManyField(Group, related_name='cluster_infra_user_set', blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name='cluster_infra_user_permissions', blank=True)

class Cluster(models.Model):
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='ACTIVE')

class Node(models.Model):
    cluster = models.ForeignKey(Cluster, on_delete=models.CASCADE)
    hostname = models.CharField(max_length=255, unique=True)
    node_type = models.CharField(max_length=50, default='worker')
    status = models.CharField(max_length=50, default='READY')

class GPU(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    gpu_index = models.IntegerField()
    model_name = models.CharField(max_length=100)
    vram_total_mb = models.FloatField()
    status = models.CharField(max_length=50, default='IDLE')
