"""Serializers that speak the frontend's existing shapes.

Two conventions are deliberate:

* Field names are camelCase, matching `src/lib/bug-board/types.ts`, so the
  TypeScript types keep describing the payload without a mapping layer.
* Timestamps are offset-less wall clock (`2026-08-04T09:12:00`), the shape the
  seeded board used. `format.ts` reads those as UTC for ordering but formats
  them with local getters, so emitting a `Z` would shift every displayed time.
"""

from datetime import timezone as dt_timezone

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.projects.models import Project

from .models import (
    Activity,
    Attachment,
    Bug,
    Comment,
    DeveloperStatus,
    Reaction,
    TesterStatus,
)

User = get_user_model()

WALL_CLOCK = "%Y-%m-%dT%H:%M:%S"


def wall_clock(value) -> str | None:
    if value is None:
        return None
    return value.astimezone(dt_timezone.utc).strftime(WALL_CLOCK)


class WallClockField(serializers.DateTimeField):
    def to_representation(self, value):
        return wall_clock(value)


class StepsField(serializers.Field):
    """Accepts the create form's raw textarea string or a ready-made list.

    `BugDraft.stepsToReproduce` is a single string while `Bug.stepsToReproduce`
    is a list, and both are posted to this endpoint, so both are allowed in.
    """

    def to_internal_value(self, data):
        if not isinstance(data, (str, list, tuple)):
            raise serializers.ValidationError(
                "Expected a string or a list of steps."
            )
        from .services import split_steps

        return split_steps(data)

    def to_representation(self, value):
        return list(value or [])


class PersonSlugField(serializers.SlugRelatedField):
    """Resolves a person by the slug id the board uses (`ishita`)."""

    def __init__(self, **kwargs):
        kwargs.setdefault("slug_field", "username")
        kwargs.setdefault("queryset", User.objects.filter(is_active=True))
        super().__init__(**kwargs)


class AttachmentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    uploadedAt = WallClockField(source="uploaded_at", read_only=True)
    uploadedById = serializers.CharField(source="uploaded_by.username", read_only=True)
    # The board's Attachment type carries the state of an in-flight browser
    # upload. Anything the server has is already finished, so these are
    # constants that keep the stored and just-uploaded shapes identical.
    progress = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = [
            "id",
            "name",
            "kind",
            "size",
            "url",
            "thumbnail",
            "uploadedAt",
            "uploadedById",
            "progress",
            "status",
        ]

    def _url(self, file_field) -> str | None:
        """Relative on purpose.

        The frontend reaches this API through a same-origin proxy, so a URL
        built from the request host would point at the backend directly and
        break the moment the origin differs. A root-relative path resolves
        against whichever origin served the page.
        """
        return file_field.url if file_field else None

    def get_url(self, obj) -> str | None:
        return self._url(obj.file)

    def get_thumbnail(self, obj) -> str | None:
        return self._url(obj.thumbnail)

    def get_progress(self, obj) -> int:
        return 100

    def get_status(self, obj) -> str:
        return "ready"


class ReactionSerializer(serializers.Serializer):
    """Rows are per person; the board wants them grouped per emoji."""

    emoji = serializers.CharField()
    byIds = serializers.ListField(child=serializers.CharField())


class CommentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    authorId = serializers.CharField(source="author.username", read_only=True)
    at = WallClockField(source="created_at", read_only=True)
    parentId = serializers.PrimaryKeyRelatedField(
        source="parent",
        queryset=Comment.objects.all(),
        required=False,
        allow_null=True,
        pk_field=serializers.CharField(),
    )
    attachments = AttachmentSerializer(many=True, read_only=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "authorId",
            "at",
            "body",
            "parentId",
            "code",
            "attachments",
            "reactions",
        ]

    def get_reactions(self, obj) -> list[dict]:
        grouped: dict[str, list[str]] = {}
        for reaction in obj.reactions.all():
            grouped.setdefault(reaction.emoji, []).append(reaction.user.username)
        return [{"emoji": emoji, "byIds": ids} for emoji, ids in grouped.items()]


class ActivitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    actorId = serializers.CharField(source="actor.username", read_only=True)
    at = WallClockField(read_only=True)

    class Meta:
        model = Activity
        fields = ["id", "kind", "actorId", "at", "summary"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # `from` cannot be a class attribute in Python, so the two transition
        # fields are added here rather than declared above.
        if instance.from_value is not None:
            data["from"] = instance.from_value
        if instance.to_value is not None:
            data["to"] = instance.to_value
        return data


class BugBaseSerializer(serializers.ModelSerializer):
    """The bug's own fields, without the child collections."""

    id = serializers.CharField(source="key", read_only=True)
    projectId = serializers.PrimaryKeyRelatedField(
        source="project", queryset=Project.objects.all()
    )
    testerStatus = serializers.ChoiceField(
        source="tester_status", choices=TesterStatus.choices, required=False
    )
    developerStatus = serializers.ChoiceField(
        source="developer_status", choices=DeveloperStatus.choices, required=False
    )
    reporterId = PersonSlugField(source="reporter")
    assigneeId = PersonSlugField(source="assignee", required=False, allow_null=True)
    watcherIds = PersonSlugField(source="watchers", many=True, required=False)
    stepsToReproduce = StepsField(source="steps_to_reproduce", required=False)
    expectedResult = serializers.CharField(
        source="expected_result", required=False, allow_blank=True
    )
    actualResult = serializers.CharField(
        source="actual_result", required=False, allow_blank=True
    )
    createdAt = WallClockField(source="created_at", read_only=True)
    updatedAt = WallClockField(source="updated_at", read_only=True)

    class Meta:
        model = Bug
        fields = [
            "id",
            "projectId",
            "title",
            "description",
            "module",
            "component",
            "severity",
            "priority",
            "testerStatus",
            "developerStatus",
            "reporterId",
            "assigneeId",
            "watcherIds",
            "environment",
            "browser",
            "device",
            "os",
            "sprint",
            "labels",
            "stepsToReproduce",
            "expectedResult",
            "actualResult",
            "createdAt",
            "updatedAt",
        ]


class BugSerializer(BugBaseSerializer):
    """The full bug — what every endpoint returns.

    Rows and the details drawer are served by the same shape on purpose: the
    board holds the whole set in the browser and opens the drawer from the row
    it already has, so a lighter row payload would leave the drawer empty.
    """

    attachments = AttachmentSerializer(many=True, read_only=True)
    activity = ActivitySerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta(BugBaseSerializer.Meta):
        fields = BugBaseSerializer.Meta.fields + [
            "attachments",
            "activity",
            "comments",
        ]


class BulkActionSerializer(serializers.Serializer):
    """One request per user action, because every board mutation is array-shaped."""

    ACTIONS = [
        "testerStatus",
        "developerStatus",
        "severity",
        "priority",
        "assign",
        "move",
        "delete",
    ]

    ids = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    action = serializers.ChoiceField(choices=ACTIONS)
    # Shape depends on the action, so it is validated in the view where the
    # action is known: a status string, a person slug, a project id, or absent.
    value = serializers.JSONField(required=False, allow_null=True)


class NewCommentSerializer(serializers.Serializer):
    body = serializers.CharField(allow_blank=True)
    code = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    parentId = serializers.IntegerField(required=False, allow_null=True)
    attachmentIds = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )


class ReactionToggleSerializer(serializers.Serializer):
    emoji = serializers.CharField(max_length=16)
