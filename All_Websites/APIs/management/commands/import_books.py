from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from APIs.models import Books


EXCLUDED_FIELDS = {"id", "created_at", "updated_at"}


def parse_value(field, value):
    value = (value or "").strip()

    if value == "":
        if field.null:
            return None
        if field.get_internal_type() == "BooleanField":
            return field.default

        return ""

    field_type = field.get_internal_type()

    if field_type == "BooleanField":
        lowered = value.lower()

        if lowered in {"true", "1", "yes", "y"}:
            return True
        if lowered in {"false", "0", "no", "n"}:
            return False

        raise ValueError(f"Invalid boolean value: {value}")

    return field.to_python(value)


class Command(BaseCommand):
    help = "Import Books records from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=Path)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        csv_file = options["csv_file"]

        if not csv_file.is_file():
            raise CommandError(f"CSV file not found: {csv_file}")

        fields = {
            field.name: field
            for field in Books._meta.fields
            if field.editable and field.name not in EXCLUDED_FIELDS
        }

        created = 0
        updated = 0

        with transaction.atomic():
            with csv_file.open("r", encoding="utf-8-sig", newline="") as file:
                reader = csv.DictReader(file)

                if not reader.fieldnames:
                    raise CommandError("The CSV file has no header row.")

                unknown_columns = set(reader.fieldnames) - set(fields)

                if unknown_columns:
                    raise CommandError(
                        "Unknown column(s): "
                        + ", ".join(sorted(unknown_columns))
                    )

                if "title" not in reader.fieldnames:
                    raise CommandError("The CSV must contain a title column.")

                for row_number, row in enumerate(reader, start=2):
                    try:
                        title = (row.get("title") or "").strip()

                        if not title:
                            raise ValueError("title is required")

                        values = {
                            name: parse_value(fields[name], row.get(name))
                            for name in reader.fieldnames
                            if name in fields
                        }

                        edition = values.get("edition", "")

                        book = Books.objects.filter(
                            title=title,
                            edition=edition,
                        ).first()

                        if book:
                            for name, value in values.items():
                                setattr(book, name, value)

                            action = "updated"
                        else:
                            book = Books(**values)
                            action = "created"

                        book.full_clean()

                        if not options["dry_run"]:
                            book.save()

                        if action == "created":
                            created += 1
                        else:
                            updated += 1

                        self.stdout.write(
                            f"Row {row_number}: {action} — {book}"
                        )

                    except (ValueError, ValidationError, TypeError) as error:
                        raise CommandError(
                            f"Row {row_number} failed: {error}"
                        ) from error

        self.stdout.write(
            self.style.SUCCESS(
                f"{'Validation' if options['dry_run'] else 'Import'} complete: "
                f"{created} created, {updated} updated."
            )
        )
        0....