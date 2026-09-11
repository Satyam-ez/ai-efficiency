from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.projects.models import Project

from . import services
from .filters import UNASSIGNED, BugFilterSet, annotate_for_sorting, apply_sort
from .models import (
    ActivityKind,
    Attachment,
    Bug,
    Comment,
    DeveloperStatus,
    Environment,
    Priority,
    Reaction,
    Severity,
    TesterStatus,
)
from .serializers import (
    AttachmentSerializer,
    BugSerializer,
    BulkActionSerializer,
    CommentSerializer,
    NewCommentSerializer,
    ReactionToggleSerializer,
)

User = get_user_model()

#: How the board defines "still open".
OPEN_TESTER_STATUSES = [
    TesterStatus.OPEN,
    TesterStatus.UNDER_REVIEW,
    TesterStatus.VERIFIED,
    TesterStatus.REOPENED,
]
SPRINT_DAYS = 14


class BugViewSet(viewsets.ModelViewSet):
    """The board's read and write surface.

    Bugs are addressed by their human key (`/api/bugs/BUG-1042/`), because that
    is the id the frontend holds and what shared hand-off links contain.
    """

    serializer_class = BugSerializer
    filterset_class = BugFilterSet
    lookup_field = "key"
    lookup_value_regex = "[A-Za-z]+-[0-9]+"

    def get_queryset(self):
        queryset = Bug.objects.select_related(
            "project", "reporter", "assignee"
        ).prefetch_related("watchers")

        if self.action in {"list", "retrieve"}:
            # The list carries the child collections too, because the board
            # filters, sorts and renders from the whole set in the browser: it
            # sorts by attachment count and opens the details drawer straight
            # from the row it already has. Prefetching keeps that to a fixed
            # number of queries rather than one per bug.
            queryset = queryset.prefetch_related(
                "attachments__uploaded_by",
                "activity__actor",
                Prefetch(
                    "comments",
                    queryset=Comment.objects.select_related(
                        "author"
                    ).prefetch_related(
                        "attachments__uploaded_by", "reactions__user"
                    ),
                ),
            )

        return annotate_for_sorting(queryset) if self.action == "list" else queryset

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        # The sort ranks are annotations that only the list queryset carries,
        # so ordering is applied there and nowhere else.
        if self.action != "list":
            return queryset
        return apply_sort(
            queryset,
            self.request.query_params.get("sort"),
            self.request.query_params.get("direction"),
        )

    @transaction.atomic
    def perform_create(self, serializer):
        # The board opens every new bug as `open`, and a bug that arrives with
        # an owner is already out of the backlog.
        assignee = serializer.validated_data.get("assignee")
        steps = services.split_steps(serializer.validated_data.get("steps_to_reproduce"))
        bug = serializer.save(
            tester_status=TesterStatus.OPEN,
            developer_status=(
                DeveloperStatus.ASSIGNED if assignee else DeveloperStatus.BACKLOG
            ),
            steps_to_reproduce=steps,
        )
        services.log(bug, bug.reporter, ActivityKind.CREATED, "reported this bug")
        if assignee:
            services.log(
                bug,
                bug.reporter,
                ActivityKind.ASSIGNED,
                f"assigned this to {assignee.name}",
            )

    @transaction.atomic
    def perform_update(self, serializer):
        bug = self.get_object()
        before = {
            "severity": bug.severity,
            "priority": bug.priority,
            "project_id": bug.project_id,
            "assignee_id": bug.assignee_id,
        }
        data = serializer.validated_data
        if "steps_to_reproduce" in data:
            data["steps_to_reproduce"] = services.split_steps(
                data["steps_to_reproduce"]
            )
        # Giving an unowned bug an assignee moves it out of the backlog, the
        # same as the dedicated assign action does.
        if data.get("assignee") and bug.developer_status == DeveloperStatus.BACKLOG:
            data["developer_status"] = DeveloperStatus.ASSIGNED

        updated = serializer.save()
        actor = self.request.user
        services.log(updated, actor, ActivityKind.EDITED, "edited the details")

        if updated.severity != before["severity"]:
            services.log(
                updated,
                actor,
                ActivityKind.SEVERITY,
                "changed severity",
                services.SEVERITY_LABELS[before["severity"]],
                services.SEVERITY_LABELS[updated.severity],
            )
        if updated.priority != before["priority"]:
            services.log(
                updated,
                actor,
                ActivityKind.PRIORITY,
                "changed priority",
                before["priority"],
                updated.priority,
            )
        if updated.project_id != before["project_id"]:
            services.log(
                updated,
                actor,
                ActivityKind.MOVED,
                "moved this to another project",
                Project.objects.get(pk=before["project_id"]).name,
                updated.project.name,
            )
        if updated.assignee_id != before["assignee_id"]:
            previous = (
                User.objects.filter(pk=before["assignee_id"]).first()
                if before["assignee_id"]
                else None
            )
            services.log(
                updated,
                actor,
                ActivityKind.ASSIGNED,
                f"assigned this to {updated.assignee.name}"
                if updated.assignee
                else "removed the assignee",
                services.person_name(previous),
                services.person_name(updated.assignee),
            )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def duplicate(self, request, key=None):
        """A fresh copy: same details, none of the history."""
        source = self.get_object()
        copy = Bug.objects.create(
            project=source.project,
            title=f"{source.title} (copy)",
            description=source.description,
            module=source.module,
            component=source.component,
            severity=source.severity,
            priority=source.priority,
            tester_status=TesterStatus.OPEN,
            developer_status=(
                DeveloperStatus.ASSIGNED if source.assignee_id else DeveloperStatus.BACKLOG
            ),
            reporter=source.reporter,
            assignee=source.assignee,
            environment=source.environment,
            browser=source.browser,
            device=source.device,
            os=source.os,
            sprint=source.sprint,
            labels=list(source.labels),
            steps_to_reproduce=list(source.steps_to_reproduce),
            expected_result=source.expected_result,
            actual_result=source.actual_result,
        )
        copy.watchers.set(source.watchers.all())
        services.log(
            copy, request.user, ActivityKind.CREATED, f"duplicated {source.key}"
        )
        return Response(
            self.get_serializer(copy).data, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Raw counts for the summary cards.

        Numbers only: the card labels, hints and deltas are presentation and
        stay in the frontend rather than being duplicated as backend copy.
        """
        bugs = self.filter_queryset(self.get_queryset())
        now = timezone.now()
        week = now - timedelta(days=7)
        sprint_start = now - timedelta(days=SPRINT_DAYS)

        open_bugs = bugs.filter(tester_status__in=OPEN_TESTER_STATUSES)
        closed = bugs.filter(tester_status=TesterStatus.CLOSED)
        critical_open = open_bugs.filter(severity=Severity.CRITICAL)

        ready_for_qa = bugs.filter(developer_status=DeveloperStatus.READY_FOR_QA)
        oldest = ready_for_qa.order_by("updated_at").values_list(
            "updated_at", flat=True
        ).first()

        return Response(
            {
                "total": bugs.count(),
                "createdThisWeek": bugs.filter(created_at__gte=week).count(),
                "open": open_bugs.count(),
                "unassigned": open_bugs.filter(assignee__isnull=True).count(),
                "critical": critical_open.count(),
                "criticalInProduction": critical_open.filter(
                    environment=Environment.PRODUCTION
                ).count(),
                "inProgress": bugs.filter(
                    developer_status=DeveloperStatus.IN_PROGRESS
                ).count(),
                "readyForQa": ready_for_qa.count(),
                "blocked": bugs.filter(
                    developer_status=DeveloperStatus.BLOCKED
                ).count(),
                "closedThisSprint": closed.filter(updated_at__gte=sprint_start).count(),
                "closedThisWeek": closed.filter(updated_at__gte=week).count(),
                "verifiedThisSprint": bugs.filter(
                    tester_status=TesterStatus.VERIFIED, updated_at__gte=sprint_start
                ).count(),
                "oldestReadyForQaDays": (now - oldest).days if oldest else 0,
            }
        )

    @action(detail=False, methods=["post"], url_path="bulk")
    @transaction.atomic
    def bulk(self, request):
        """One request per user action.

        Every board mutation is already array-shaped (`setSeverity(ids, value)`),
        so selecting 40 rows and closing them is one call, not 40.
        """
        form = BulkActionSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        keys = form.validated_data["ids"]
        action_name = form.validated_data["action"]
        value = form.validated_data.get("value")

        bugs = list(Bug.objects.select_related("project", "assignee").filter(key__in=keys))
        missing = sorted(set(keys) - {bug.key for bug in bugs})
        if missing:
            raise ValidationError({"ids": f"Unknown bug(s): {', '.join(missing)}"})

        actor = request.user

        if action_name == "delete":
            Bug.objects.filter(key__in=keys).delete()
            return Response({"deleted": len(bugs)})

        handlers = {
            "testerStatus": (TesterStatus, services.set_tester_status),
            "developerStatus": (DeveloperStatus, services.set_developer_status),
            "severity": (Severity, services.set_severity),
            "priority": (Priority, services.set_priority),
        }

        if action_name in handlers:
            choices, apply = handlers[action_name]
            if value not in choices.values:
                raise ValidationError(
                    {"value": f"Expected one of {list(choices.values)}."}
                )
            changed = sum(bool(apply(bug, actor, value)) for bug in bugs)
        elif action_name == "assign":
            assignee = None
            if value not in (None, "", UNASSIGNED):
                assignee = User.objects.filter(username=value).first()
                if assignee is None:
                    raise ValidationError({"value": f"Unknown person '{value}'."})
            changed = sum(bool(services.assign(bug, actor, assignee)) for bug in bugs)
        else:  # move
            destination = Project.objects.filter(pk=value).first() if value else None
            if destination is None:
                raise ValidationError({"value": "Expected an existing project id."})
            changed = sum(
                bool(services.move_to_project(bug, actor, destination)) for bug in bugs
            )

        return Response({"matched": len(bugs), "changed": changed})

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, key=None):
        bug = self.get_object()
        if request.method == "GET":
            return Response(
                CommentSerializer(
                    bug.comments.all(), many=True, context=self.get_serializer_context()
                ).data
            )

        form = NewCommentSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        data = form.validated_data

        parent = None
        if data.get("parentId"):
            parent = bug.comments.filter(pk=data["parentId"]).first()
            if parent is None:
                raise ValidationError(
                    {"parentId": "That comment is not on this bug."}
                )

        with transaction.atomic():
            comment = Comment.objects.create(
                bug=bug,
                author=request.user,
                body=data["body"].strip(),
                code=data.get("code") or None,
                parent=parent,
            )
            # Files are uploaded first, then claimed by the comment, so a
            # comment attachment also shows up in the bug's evidence list.
            attachment_ids = data.get("attachmentIds") or []
            if attachment_ids:
                Attachment.objects.filter(
                    bug=bug, comment__isnull=True, pk__in=attachment_ids
                ).update(comment=comment)
            services.log(
                bug,
                request.user,
                ActivityKind.COMMENT,
                "replied to a comment" if parent else "added a comment",
            )

        comment = (
            Comment.objects.select_related("author")
            .prefetch_related("attachments__uploaded_by", "reactions__user")
            .get(pk=comment.pk)
        )
        return Response(
            CommentSerializer(comment, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="attachments")
    @transaction.atomic
    def upload_attachment(self, request, key=None):
        bug = self.get_object()
        upload = request.FILES.get("file")
        if upload is None:
            raise ValidationError({"file": "No file was uploaded."})

        attachment = Attachment.objects.create(
            bug=bug,
            name=request.data.get("name") or upload.name,
            kind=request.data.get("kind") or "file",
            size=upload.size,
            file=upload,
            thumbnail=request.FILES.get("thumbnail"),
            uploaded_by=request.user,
        )
        services.log(
            bug, request.user, ActivityKind.ATTACHMENT, f"attached {attachment.name}"
        )
        return Response(
            AttachmentSerializer(
                attachment, context=self.get_serializer_context()
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AttachmentViewSet(viewsets.GenericViewSet):
    queryset = Attachment.objects.select_related("bug", "uploaded_by")
    serializer_class = AttachmentSerializer

    @transaction.atomic
    def destroy(self, request, pk=None):
        attachment = self.get_object()
        bug, name = attachment.bug, attachment.name
        attachment.delete()
        services.log(bug, request.user, ActivityKind.ATTACHMENT, f"removed {name}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentViewSet(viewsets.GenericViewSet):
    queryset = Comment.objects.select_related("author", "bug")
    serializer_class = CommentSerializer

    @action(detail=True, methods=["post"])
    def reactions(self, request, pk=None):
        """Toggles one emoji for the signed-in person."""
        comment = self.get_object()
        form = ReactionToggleSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        emoji = form.validated_data["emoji"]

        existing = Reaction.objects.filter(
            comment=comment, user=request.user, emoji=emoji
        )
        if existing.exists():
            existing.delete()
        else:
            Reaction.objects.create(comment=comment, user=request.user, emoji=emoji)

        comment = (
            Comment.objects.select_related("author")
            .prefetch_related("attachments__uploaded_by", "reactions__user")
            .get(pk=comment.pk)
        )
        return Response(
            CommentSerializer(comment, context=self.get_serializer_context()).data
        )


@api_view(["GET"])
def meta(request):
    """The option lists the forms need, so `data.ts` stops owning the dropdowns."""
    from apps.accounts.serializers import PersonSerializer

    def distinct(field: str) -> list[str]:
        return sorted(
            value
            for value in Bug.objects.order_by()
            .values_list(field, flat=True)
            .distinct()
            if value
        )

    labels = sorted(
        {label for row in Bug.objects.values_list("labels", flat=True) for label in row}
    )

    return Response(
        {
            "people": PersonSerializer(
                User.objects.filter(is_active=True), many=True
            ).data,
            "severities": list(Severity.values),
            "priorities": list(Priority.values),
            "testerStatuses": list(TesterStatus.values),
            "developerStatuses": list(DeveloperStatus.values),
            "environments": list(Environment.values),
            "activityKinds": list(ActivityKind.values),
            "modules": distinct("module"),
            "components": distinct("component"),
            "sprints": distinct("sprint"),
            "browsers": distinct("browser"),
            "devices": distinct("device"),
            "operatingSystems": distinct("os"),
            "labels": labels,
            "reactionEmoji": ["👍", "🎉", "👀", "🐛", "🙏"],
        }
    )
