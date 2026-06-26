from django.contrib import admin
from .models import Prediction, Alert

admin.site.register(Prediction)
admin.site.register(Alert)
