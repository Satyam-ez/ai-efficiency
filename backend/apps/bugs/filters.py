"""Server-side twin of `filterBugs` / `sortBugs` in src/lib/bug-board/filters.ts.

The board's sort order is not alphabetical: severity, priority and both status
columns sort by workflow rank (critical first, blocked first, ...). Those ranks
are rebuilt here as SQL CASE expressions so a paginated request returns the same
rows in the same order the in-memory board did.
"""

import django_filters as filters
from django.db.models import (
    Case,
    Count,
    F,
    IntegerField,
    Q,
    TextField,
    Value,
    When,
)
from django.db.models.functions import Cast

from .models import Bug, DeveloperStatus, Priority, Severity, TesterStatus

#: The board's sentinel for "no assignee" inside the assignee facet.
UNASSIGNED = "unassigned"


def _rank(field: str, order: list[str]):
    return Case(
        *[When(**{field: value}, then=Value(index)) for index, value in enumerate(order)],
        default=Value(len(order)),
        output_field=IntegerField(),
    )


SEVERITY_ORDER = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]
PRIORITY_ORDER = [Priority.P0, Priority.P1, Priority.P2, Priority.P3]
TESTER_ORDER = [
    TesterStatus.OPEN,
    TesterStatus.REOPENED,
    TesterStatus.UNDER_REVIEW,
    TesterStatus.VERIFIED,
    TesterStatus.CLOSED,
]
DEVELOPER_ORDER = [
    DeveloperStatus.BLOCKED,
    DeveloperStatus.BACKLOG,
    DeveloperStatus.ASSIGNED,
    DeveloperStatus.IN_PROGRESS,
    DeveloperStatus.READY_FOR_QA,
    DeveloperStatus.FIXED,
]

#: Sort key from the frontend -> the annotation/field the database orders by.
SORT_FIELDS = {
    "id": "number",
    "title": "title",
    "module": "module",
    "severity": "_severity_rank",
    "priority": "_priority_rank",
    "reporter": "reporter__name",
    "testerStatus": "_tester_rank",
    "developerStatus": "_developer_rank",
    "assignee": "assignee__name",
    "attachments": "_attachment_count",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
}

DEFAULT_SORT = "updatedAt"
DEFAULT_DIRECTION = "desc"


def annotate_for_sorting(queryset):
    return queryset.annotate(
        _severity_rank=_rank("severity", SEVERITY_ORDER),
        _priority_rank=_rank("priority", PRIORITY_ORDER),
        _tester_rank=_rank("tester_status", TESTER_ORDER),
        _developer_rank=_rank("developer_status", DEVELOPER_ORDER),
        _attachment_count=Count("attachments", distinct=True),
    )


def apply_sort(queryset, sort: str | None, direction: str | None):
    field = SORT_FIELDS.get(sort or DEFAULT_SORT, SORT_FIELDS[DEFAULT_SORT])
    descending = (direction or DEFAULT_DIRECTION).lower() == "desc"
    expression = F(field).desc(nulls_last=True) if descending else F(field).asc(
        nulls_first=True
    )
    # Ties fall back to the bug number, so pagination stays stable.
    return queryset.order_by(expression, "number")


class CommaSeparatedFilter(filters.BaseInFilter, filters.CharFilter):
    """Accepts both `?severity=high,low` and repeated `?severity=high&severity=low`."""

    def filter(self, qs, value):
        if not value:
            return qs
        values = [item for item in value if item]
        if not values:
            return qs
        return qs.filter(**{f"{self.field_name}__in": values})


class BugFilterSet(filters.FilterSet):
    query = filters.CharFilter(method="filter_query")
    bugIds = CommaSeparatedFilter(field_name="key")
    projectIds = CommaSeparatedFilter(field_name="project_id")
    testerStatus = CommaSeparatedFilter(field_name="tester_status")
    developerStatus = CommaSeparatedFilter(field_name="developer_status")
    severity = CommaSeparatedFilter(field_name="severity")
    priority = CommaSeparatedFilter(field_name="priority")
    reporterIds = CommaSeparatedFilter(field_name="reporter__username")
    assigneeIds = filters.CharFilter(method="filter_assignees")
    modules = CommaSeparatedFilter(field_name="module")
    sprints = CommaSeparatedFilter(field_name="sprint")
    environments = CommaSeparatedFilter(field_name="environment")
    createdFrom = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    # `date__lte` rather than a raw timestamp compare, so a single-day range
    # still includes the bugs filed that day.
    createdTo = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Bug
        fields: list[str] = []

    def filter_query(self, queryset, name, value):
        needle = (value or "").strip()
        if not needle:
            return queryset
        # `labels` is a Postgres array, which has no substring lookup, so it is
        # cast to text to match the frontend's "join every field and search it".
        return queryset.annotate(
            _labels_text=Cast("labels", TextField())
        ).filter(
            Q(key__icontains=needle)
            | Q(title__icontains=needle)
            | Q(module__icontains=needle)
            | Q(component__icontains=needle)
            | Q(sprint__icontains=needle)
            | Q(description__icontains=needle)
            | Q(reporter__name__icontains=needle)
            | Q(assignee__name__icontains=needle)
            | Q(_labels_text__icontains=needle)
        )

    def filter_assignees(self, queryset, name, value):
        """`unassigned` is a selectable option in the facet, not an empty filter."""
        selected = [item for item in (value or "").split(",") if item]
        if not selected:
            return queryset
        usernames = [item for item in selected if item != UNASSIGNED]
        condition = Q(assignee__username__in=usernames) if usernames else Q()
        if UNASSIGNED in selected:
            condition = condition | Q(assignee__isnull=True)
        return queryset.filter(condition)
