"""Mutations that keep the audit trail honest.

The activity feed is written here rather than accepted from the client, because
the code that applies a change is the only thing that reliably knows what the
value was before it. Every helper mirrors the equivalent function in
`src/components/bug-board/bug-board-provider.tsx`.
"""

from django.db import transaction

from .models import (
    Activity,
    ActivityKind,
    Bug,
    DeveloperStatus,
    Severity,
    TesterStatus,
)

SEVERITY_LABELS = dict(Severity.choices)
TESTER_STATUS_LABELS = dict(TesterStatus.choices)
DEVELOPER_STATUS_LABELS = dict(DeveloperStatus.choices)


def log(
    bug: Bug,
    actor,
    kind: str,
    summary: str,
    from_value: str | None = None,
    to_value: str | None = None,
) -> Activity:
    return Activity.objects.create(
        bug=bug,
        actor=actor,
        kind=kind,
        summary=summary,
        from_value=from_value,
        to_value=to_value,
    )


def person_name(user) -> str:
    return user.name if user else "Unassigned"


@transaction.atomic
def set_tester_status(bug: Bug, actor, status: str) -> bool:
    if bug.tester_status == status:
        return False
    previous = bug.tester_status
    bug.tester_status = status
    bug.save(update_fields=["tester_status", "updated_at"])
    # A verify/close/reopen is worth its own icon in the timeline; anything else
    # is a plain status move.
    kind = {
        TesterStatus.VERIFIED: ActivityKind.VERIFIED,
        TesterStatus.CLOSED: ActivityKind.CLOSED,
        TesterStatus.REOPENED: ActivityKind.REOPENED,
    }.get(status, ActivityKind.STATUS)
    log(
        bug,
        actor,
        kind,
        "changed tester status",
        TESTER_STATUS_LABELS[previous],
        TESTER_STATUS_LABELS[status],
    )
    return True


@transaction.atomic
def set_developer_status(bug: Bug, actor, status: str) -> bool:
    if bug.developer_status == status:
        return False
    previous = bug.developer_status
    bug.developer_status = status
    bug.save(update_fields=["developer_status", "updated_at"])
    kind = (
        ActivityKind.FIXED
        if status == DeveloperStatus.FIXED
        else ActivityKind.STATUS
    )
    log(
        bug,
        actor,
        kind,
        "changed developer status",
        DEVELOPER_STATUS_LABELS[previous],
        DEVELOPER_STATUS_LABELS[status],
    )
    return True


@transaction.atomic
def set_severity(bug: Bug, actor, severity: str) -> bool:
    if bug.severity == severity:
        return False
    previous = bug.severity
    bug.severity = severity
    bug.save(update_fields=["severity", "updated_at"])
    log(
        bug,
        actor,
        ActivityKind.SEVERITY,
        "changed severity",
        SEVERITY_LABELS[previous],
        SEVERITY_LABELS[severity],
    )
    return True


@transaction.atomic
def set_priority(bug: Bug, actor, priority: str) -> bool:
    if bug.priority == priority:
        return False
    previous = bug.priority
    bug.priority = priority
    bug.save(update_fields=["priority", "updated_at"])
    log(bug, actor, ActivityKind.PRIORITY, "changed priority", previous, priority)
    return True


@transaction.atomic
def assign(bug: Bug, actor, assignee) -> bool:
    if bug.assignee_id == (assignee.id if assignee else None):
        return False
    previous = bug.assignee
    bug.assignee = assignee
    fields = ["assignee", "updated_at"]
    # Taking a bug out of the backlog is implied by giving it an owner.
    if assignee and bug.developer_status == DeveloperStatus.BACKLOG:
        bug.developer_status = DeveloperStatus.ASSIGNED
        fields.append("developer_status")
    bug.save(update_fields=fields)
    log(
        bug,
        actor,
        ActivityKind.ASSIGNED,
        f"assigned this to {person_name(assignee)}"
        if assignee
        else "removed the assignee",
        person_name(previous),
        person_name(assignee),
    )
    return True


@transaction.atomic
def move_to_project(bug: Bug, actor, project) -> bool:
    if bug.project_id == project.id:
        return False
    previous = bug.project.name
    bug.project = project
    bug.save(update_fields=["project", "updated_at"])
    log(
        bug,
        actor,
        ActivityKind.MOVED,
        "moved this to another project",
        previous,
        project.name,
    )
    return True


def split_steps(value) -> list[str]:
    """Normalises the steps field into one clean step per entry.

    The board's create form is a single textarea, so the value arrives either as
    that raw string or as an already-split list. Either way each line is split
    on newlines and any numbering the user typed by hand is stripped, matching
    `splitSteps` in bug-board-provider.tsx.
    """
    import re

    entries = value if isinstance(value, (list, tuple)) else [value]
    steps = []
    for entry in entries:
        for line in str(entry or "").split("\n"):
            step = re.sub(r"^\s*\d+[.)]\s*", "", line).strip()
            if step:
                steps.append(step)
    return steps
