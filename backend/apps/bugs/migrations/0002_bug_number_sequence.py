from django.db import migrations

from apps.bugs.models import BUG_NUMBER_SEQUENCE

# The seeded board occupies BUG-1017 .. BUG-1042, so anything new starts after
# it and existing links keep pointing at the bug they always did.
FIRST_NEW_BUG_NUMBER = 1043


class Migration(migrations.Migration):
    dependencies = [("bugs", "0001_initial")]

    operations = [
        migrations.RunSQL(
            sql=(
                f"CREATE SEQUENCE IF NOT EXISTS {BUG_NUMBER_SEQUENCE} "
                f"START WITH {FIRST_NEW_BUG_NUMBER} INCREMENT BY 1;"
            ),
            reverse_sql=f"DROP SEQUENCE IF EXISTS {BUG_NUMBER_SEQUENCE};",
        )
    ]
