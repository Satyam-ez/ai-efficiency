"""Loads the board the frontend used to hold in memory.

`apps/bugs/fixtures/seed.json` was exported straight out of
`src/lib/bug-board/data.ts`, so a freshly seeded database renders the same board
the mock data did — same bug keys, same timestamps, same comment threads.

Re-running is safe: people and projects are matched on their stable ids, and a
bug whose key is already present is left alone unless `--reset` is passed.
"""

import json
import os
import uuid
from datetime import datetime, timezone as dt_timezone
from pathlib import Path
from urllib.parse import unquote

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.bugs.models import (
    Activity,
    Attachment,
    Bug,
    Comment,
    Reaction,
)
from apps.projects.models import Project

User = get_user_model()

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "seed.json"

#: Fixed namespace, so `proj-atlas` always maps to the same UUID and links made
#: against a seeded board keep resolving after a reseed.
PROJECT_NAMESPACE = uuid.UUID("6f9619ff-8b86-d011-b42d-00c04fc964ff")

#: Data URIs in the fixture are inline SVG placeholders. The stored file needs
#: an extension matching its bytes, while the attachment's display name keeps
#: the original (`screenshot.png`), so the UI reads the same as before.
EXTENSION_BY_MIME = {
    "image/svg+xml": ".svg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def project_uuid(slug: str) -> uuid.UUID:
    return uuid.uuid5(PROJECT_NAMESPACE, slug)


def stamp(value: str | None):
    """Fixture timestamps are offset-less wall clock, read as UTC."""
    if not value:
        return None
    return datetime.fromisoformat(value).replace(tzinfo=dt_timezone.utc)


def decode_data_uri(value: str | None) -> tuple[bytes, str] | None:
    """Returns `(content, extension)` for a `data:` URI, or None."""
    if not value or not value.startswith("data:"):
        return None
    header, _, payload = value.partition(",")
    if not payload:
        return None
    mime = header[len("data:") :].split(";")[0]
    extension = EXTENSION_BY_MIME.get(mime, ".bin")
    if ";base64" in header:
        import base64

        return base64.b64decode(payload), extension
    return unquote(payload).encode("utf-8"), extension


class Command(BaseCommand):
    help = "Seeds people, projects, bugs, comments and evidence from the fixture."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing bugs and seeded projects before loading.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not FIXTURE.exists():
            raise CommandError(f"Fixture not found: {FIXTURE}")

        data = json.loads(FIXTURE.read_text())
        # Loaded into the environment from backend/.env when settings imported.
        password = os.environ.get("SEED_USER_PASSWORD", "bugboard-dev")

        if options["reset"]:
            # Bugs first: the project FK is PROTECT.
            Bug.objects.all().delete()
            Project.objects.filter(
                id__in=[project_uuid(item["id"]) for item in data["projects"]]
            ).delete()
            self.stdout.write("Cleared existing bugs and seeded projects.")

        people = self._seed_people(data["people"], password)
        projects = self._seed_projects(data["projects"])
        created, skipped = self._seed_bugs(data["bugs"], people, projects)

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(people)} people, {len(projects)} projects, "
                f"{created} bugs created ({skipped} already present)."
            )
        )
        if created:
            self.stdout.write(
                f"Every seeded person signs in with the password: {password}"
            )

    def _seed_people(self, rows, password) -> dict:
        people = {}
        for row in rows:
            user, created = User.objects.get_or_create(
                username=row["id"],
                defaults={
                    "name": row["name"],
                    "initials": row["initials"],
                    "role": row["role"],
                    "email": f"{row['id']}@bugboard.local",
                },
            )
            if created:
                user.set_password(password)
                user.save(update_fields=["password"])
            people[row["id"]] = user
        return people

    def _seed_projects(self, rows) -> dict:
        projects = {}
        for row in rows:
            project, _ = Project.objects.update_or_create(
                id=project_uuid(row["id"]),
                defaults={"name": row["name"], "description": row["description"]},
            )
            created_at = stamp(row.get("createdAt"))
            if created_at:
                Project.objects.filter(pk=project.pk).update(created_at=created_at)
            projects[row["id"]] = project
        return projects

    def _seed_bugs(self, rows, people, projects) -> tuple[int, int]:
        existing = set(Bug.objects.values_list("key", flat=True))
        created = 0
        skipped = 0

        for row in rows:
            if row["id"] in existing:
                skipped += 1
                continue

            bug = Bug(
                number=int(row["id"].split("-")[-1]),
                key=row["id"],
                project=projects[row["projectId"]],
                title=row["title"],
                description=row["description"],
                module=row["module"],
                component=row["component"],
                severity=row["severity"],
                priority=row["priority"],
                tester_status=row["testerStatus"],
                developer_status=row["developerStatus"],
                reporter=people[row["reporterId"]],
                assignee=people[row["assigneeId"]] if row.get("assigneeId") else None,
                environment=row["environment"],
                browser=row["browser"],
                device=row["device"],
                os=row["os"],
                sprint=row["sprint"],
                labels=list(row["labels"]),
                steps_to_reproduce=list(row["stepsToReproduce"]),
                expected_result=row["expectedResult"],
                actual_result=row["actualResult"],
            )
            bug.save()
            bug.watchers.set(people[pid] for pid in row.get("watcherIds", []))

            self._seed_comments(bug, row.get("comments", []), people)
            self._seed_attachments(bug, row.get("attachments", []), people)
            self._seed_activity(bug, row.get("activity", []), people)

            # `auto_now_add` / `auto_now` ignore assigned values, so the real
            # fixture timestamps are written back afterwards. Without this every
            # bug would read as filed today and "3d ago" would be wrong.
            Bug.objects.filter(pk=bug.pk).update(
                created_at=stamp(row["createdAt"]),
                updated_at=stamp(row["updatedAt"]),
            )
            created += 1

        self._realign_sequence()
        return created, skipped

    def _seed_comments(self, bug, rows, people):
        by_fixture_id = {}
        # Two passes: a reply can only point at a comment that already exists.
        for row in rows:
            comment = Comment.objects.create(
                bug=bug,
                author=people[row["authorId"]],
                body=row["body"],
                code=row.get("code") or None,
            )
            Comment.objects.filter(pk=comment.pk).update(created_at=stamp(row["at"]))
            by_fixture_id[row["id"]] = comment

            for reaction in row.get("reactions", []):
                for person_id in reaction["byIds"]:
                    Reaction.objects.get_or_create(
                        comment=comment,
                        user=people[person_id],
                        emoji=reaction["emoji"],
                    )

        for row in rows:
            parent_id = row.get("parentId")
            if parent_id and parent_id in by_fixture_id:
                child = by_fixture_id[row["id"]]
                child.parent = by_fixture_id[parent_id]
                child.save(update_fields=["parent"])

    def _seed_attachments(self, bug, rows, people):
        for row in rows:
            attachment = Attachment(
                bug=bug,
                name=row["name"],
                kind=row["kind"],
                size=row["size"],
                uploaded_by=people[row["uploadedById"]],
            )
            base = Path(row["name"]).stem

            decoded = decode_data_uri(row.get("url"))
            if decoded:
                content, extension = decoded
                attachment.file.save(
                    f"{base}{extension}", ContentFile(content), save=False
                )

            decoded = decode_data_uri(row.get("thumbnail"))
            if decoded:
                content, extension = decoded
                attachment.thumbnail.save(
                    f"{base}-poster{extension}", ContentFile(content), save=False
                )

            attachment.save()
            Attachment.objects.filter(pk=attachment.pk).update(
                uploaded_at=stamp(row["uploadedAt"])
            )

    def _seed_activity(self, bug, rows, people):
        for row in rows:
            entry = Activity.objects.create(
                bug=bug,
                kind=row["kind"],
                actor=people[row["actorId"]],
                summary=row["summary"],
                from_value=row.get("from"),
                to_value=row.get("to"),
            )
            Activity.objects.filter(pk=entry.pk).update(at=stamp(row["at"]))

    def _realign_sequence(self):
        """Keeps the sequence ahead of the seeded keys.

        Seeded bugs set `number` directly and never touch the sequence, so it is
        pushed past the highest seeded value — otherwise the first bug filed
        through the UI could collide with an existing key.
        """
        from django.db import connection

        from apps.bugs.models import BUG_NUMBER_SEQUENCE

        highest = Bug.objects.order_by("-number").values_list("number", flat=True).first()
        if highest is None:
            return
        with connection.cursor() as cursor:
            # setval records the last value issued, so the next nextval() is
            # highest + 1.
            cursor.execute(f"SELECT setval('{BUG_NUMBER_SEQUENCE}', %s)", [highest])
