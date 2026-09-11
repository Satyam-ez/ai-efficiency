from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.bugs.services import move_to_project

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    pagination_class = None

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Deleting a project never deletes its bugs.

        A project holding bugs can only go away once they have somewhere to
        land, so the caller must name a destination via `?moveTo=<projectId>` —
        the server-side twin of the board's `deleteProject(id, moveToId)` rule.
        The FK is PROTECT, so a missing destination fails loudly instead of
        cascading.
        """
        project = self.get_object()
        owned = list(project.bugs.all())

        if owned:
            move_to_id = request.query_params.get("moveTo")
            if not move_to_id or move_to_id == str(project.id):
                return Response(
                    {
                        "detail": (
                            f"{project.name} still holds {len(owned)} bug(s). "
                            "Pass ?moveTo=<projectId> to move them first."
                        )
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            try:
                destination = Project.objects.get(pk=move_to_id)
            except (Project.DoesNotExist, ValueError, TypeError):
                return Response(
                    {"detail": "The project named in moveTo does not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for bug in owned:
                move_to_project(bug, request.user, destination)

        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
