from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "name", "role", "is_staff"]
    list_filter = ["role", "is_staff", "is_active"]
    search_fields = ["username", "name", "email"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Bug board", {"fields": ("name", "initials", "role")}),
    )
