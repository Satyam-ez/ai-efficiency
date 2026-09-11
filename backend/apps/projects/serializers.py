from rest_framework import serializers

from apps.bugs.serializers import WallClockField

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    createdAt = WallClockField(source="created_at", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "createdAt"]
