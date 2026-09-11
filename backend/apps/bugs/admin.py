from django.contrib import admin

from .models import Activity, Attachment, Bug, Comment, Reaction


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ["author", "body", "parent", "created_at"]
    readonly_fields = ["created_at"]


class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 0
    # The audit trail is written by the server, so the admin only reads it.
    readonly_fields = ["kind", "actor", "summary", "from_value", "to_value", "at"]
    can_delete = False

    def has_add_permission(self, request, obj):
        return False


@admin.register(Bug)
class BugAdmin(admin.ModelAdmin):
    list_display = [
        "key",
        "title",
        "project",
        "severity",
        "priority",
        "tester_status",
        "developer_status",
        "assignee",
        "updated_at",
    ]
    list_filter = [
        "project",
        "severity",
        "priority",
        "tester_status",
        "developer_status",
        "environment",
    ]
    search_fields = ["key", "title", "description", "module", "component"]
    readonly_fields = ["key", "number", "created_at", "updated_at"]
    autocomplete_fields = ["reporter", "assignee", "watchers"]
    inlines = [AttachmentInline, CommentInline, ActivityInline]


admin.site.register([Comment, Attachment, Reaction, Activity])
