from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    """Mirrors PersonRole in src/lib/bug-board/types.ts."""

    DEVELOPER = "developer", "Developer"
    TESTER = "tester", "Tester"
    MANAGER = "manager", "Manager"


class User(AbstractUser):
    """Replaces the seeded `Person` list.

    `username` carries the slug the frontend already uses as a person id
    (`ishita`, `aarav`, ...), so seeded references keep resolving.
    """

    name = models.CharField(max_length=120, blank=True)
    initials = models.CharField(max_length=4, blank=True)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.DEVELOPER)

    class Meta:
        ordering = ["name", "username"]

    def __str__(self) -> str:
        return self.name or self.username

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"{self.first_name} {self.last_name}".strip() or self.username
        if not self.initials:
            parts = [part for part in self.name.split() if part]
            self.initials = "".join(part[0] for part in parts[:2]).upper()
        super().save(*args, **kwargs)
