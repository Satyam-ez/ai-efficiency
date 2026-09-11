"""Bug board domain models.

Every choice value here is byte-identical to the string literal used in
`src/lib/bug-board/types.ts` (kebab-case included), so the API needs no
translation layer between the database and the existing frontend types.
"""

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import connection, models

BUG_NUMBER_SEQUENCE = "bugs_bug_number_seq"


class Severity(models.TextChoices):
    CRITICAL = "critical", "Critical"
    HIGH = "high", "High"
    MEDIUM = "medium", "Medium"
    LOW = "low", "Low"


class Priority(models.TextChoices):
    P0 = "P0", "P0"
    P1 = "P1", "P1"
    P2 = "P2", "P2"
    P3 = "P3", "P3"


class TesterStatus(models.TextChoices):
    """The QA-owned side of the workflow."""

    OPEN = "open", "Open"
    UNDER_REVIEW = "under-review", "Under Review"
    VERIFIED = "verified", "Verified"
    REOPENED = "reopened", "Reopened"
    CLOSED = "closed", "Closed"


class DeveloperStatus(models.TextChoices):
    """The engineering-owned side of the workflow."""

    BACKLOG = "backlog", "Backlog"
    ASSIGNED = "assigned", "Assigned"
    IN_PROGRESS = "in-progress", "In Progress"
    READY_FOR_QA = "ready-for-qa", "Ready for QA"
    FIXED = "fixed", "Fixed"
    BLOCKED = "blocked", "Blocked"


class Environment(models.TextChoices):
    PRODUCTION = "production", "Production"
    STAGING = "staging", "Staging"
    DEVELOPMENT = "development", "Development"


class AttachmentKind(models.TextChoices):
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"
    RECORDING = "recording", "Screen recording"
    PDF = "pdf", "PDF"
    ARCHIVE = "archive", "Archive"
    LOG = "log", "Log file"
    FILE = "file", "File"


class ActivityKind(models.TextChoices):
    CREATED = "created", "Created"
    EDITED = "edited", "Edited"
    MOVED = "moved", "Moved"
    ASSIGNED = "assigned", "Assigned"
    STATUS = "status", "Status"
    SEVERITY = "severity", "Severity"
    PRIORITY = "priority", "Priority"
    COMMENT = "comment", "Comment"
    ATTACHMENT = "attachment", "Attachment"
    FIXED = "fixed", "Fixed"
    VERIFIED = "verified", "Verified"
    CLOSED = "closed", "Closed"
    REOPENED = "reopened", "Reopened"


def next_bug_number() -> int:
    """Next bug number, straight from a Postgres sequence.

    A `MAX(number) + 1` read would let two testers filing at the same moment
    land on the same key; the sequence cannot.
    """
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT nextval('{BUG_NUMBER_SEQUENCE}')")
        return int(cursor.fetchone()[0])


class Bug(models.Model):
    # `key` is what the frontend and shared links use (`?bugs=BUG-1042`), so it
    # is a real indexed column rather than something derived on read.
    number = models.IntegerField(unique=True, editable=False)
    key = models.CharField(max_length=24, unique=True, editable=False, db_index=True)

    project = models.ForeignKey(
        "projects.Project",
        # Deleting a project must not silently delete its bugs: the board's own
        # rule is that they get moved first.
        on_delete=models.PROTECT,
        related_name="bugs",
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=120, blank=True)
    component = models.CharField(max_length=120, blank=True)

    severity = models.CharField(
        max_length=16, choices=Severity.choices, default=Severity.MEDIUM
    )
    priority = models.CharField(
        max_length=4, choices=Priority.choices, default=Priority.P2
    )
    tester_status = models.CharField(
        max_length=16, choices=TesterStatus.choices, default=TesterStatus.OPEN
    )
    developer_status = models.CharField(
        max_length=16, choices=DeveloperStatus.choices, default=DeveloperStatus.BACKLOG
    )

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_bugs",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_bugs",
    )
    watchers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="watched_bugs"
    )

    environment = models.CharField(
        max_length=16, choices=Environment.choices, default=Environment.PRODUCTION
    )
    browser = models.CharField(max_length=120, blank=True)
    device = models.CharField(max_length=120, blank=True)
    os = models.CharField(max_length=120, blank=True)
    sprint = models.CharField(max_length=60, blank=True)

    labels = ArrayField(models.CharField(max_length=60), default=list, blank=True)
    # Ordered free text, so an array column beats a child table with positions.
    steps_to_reproduce = ArrayField(models.TextField(), default=list, blank=True)
    expected_result = models.TextField(blank=True)
    actual_result = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tester_status"]),
            models.Index(fields=["developer_status"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["project", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.key} {self.title}"

    def save(self, *args, **kwargs):
        if self.number is None:
            self.number = next_bug_number()
        if not self.key:
            self.key = f"BUG-{self.number}"
        super().save(*args, **kwargs)


class Comment(models.Model):
    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="comments"
    )
    body = models.TextField(blank=True)
    # Self-FK, so a reply hangs off the comment it answers.
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
    code = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.bug_id} · {self.author_id}"


class Attachment(models.Model):
    """Evidence on a bug, optionally posted inside a comment.

    `comment` being nullable reproduces the board's behaviour: a file attached to
    a comment shows up in that comment *and* in the bug's evidence list.

    The client-side `progress`/`status` pair is deliberately absent — they
    describe an in-flight browser upload, so the server only ever holds a
    finished file.
    """

    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name="attachments")
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    name = models.CharField(max_length=255)
    kind = models.CharField(
        max_length=16, choices=AttachmentKind.choices, default=AttachmentKind.FILE
    )
    size = models.BigIntegerField(default=0)
    file = models.FileField(upload_to="attachments/%Y/%m/", null=True, blank=True)
    # A FileField rather than an ImageField: posters are SVG placeholders and
    # video frames, and Pillow cannot open SVG.
    thumbnail = models.FileField(
        upload_to="thumbnails/%Y/%m/", null=True, blank=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="uploads"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self) -> str:
        return self.name


class Reaction(models.Model):
    """One row per person per emoji; grouped into `{emoji, byIds}` on read."""

    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reactions"
    )
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "user", "emoji"], name="unique_reaction_per_user"
            )
        ]

    def __str__(self) -> str:
        return f"{self.emoji} {self.user_id}"


class Activity(models.Model):
    """The audit trail.

    Written by the server, never accepted from the client: the endpoint that
    changes a status is the only thing that reliably knows what it changed from.
    """

    bug = models.ForeignKey(Bug, on_delete=models.CASCADE, related_name="activity")
    kind = models.CharField(max_length=16, choices=ActivityKind.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="activity"
    )
    summary = models.CharField(max_length=300)
    from_value = models.CharField(max_length=160, null=True, blank=True)
    to_value = models.CharField(max_length=160, null=True, blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["at", "id"]
        verbose_name_plural = "activity"

    def __str__(self) -> str:
        return f"{self.bug_id} {self.kind}"
