from rest_framework import permissions

class IsClusterOperator(permissions.BasePermission):
    """
    Custom permission to only allow cluster operators to access or mutate resources.
    For the hackathon SaaS demo, we assume any user in the 'Operators' group
    or superusers have access.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        return request.user.groups.filter(name='Operators').exists()
