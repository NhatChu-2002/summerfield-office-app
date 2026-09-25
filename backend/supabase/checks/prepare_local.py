"""Copy inventory/HQ migrations and HQ tests into an unlinked local Supabase project."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


SUPABASE_DIR = Path(__file__).resolve().parents[1]
DATA_ONLY_MIGRATIONS = {"202609160003_add_seasonal_drinks.sql"}


def copy_unchanged(source: Path, destination: Path, refresh: bool) -> None:
    if destination.exists():
        if destination.read_bytes() != source.read_bytes():
            if not refresh:
                raise ValueError(f"refusing to overwrite a modified local file: {destination.name}; pass --refresh to replace copied files")
            shutil.copy2(source, destination)
        return
    shutil.copy2(source, destination)


def prepare(inventory_migrations: Path, project: Path, refresh: bool = False) -> tuple[int, int]:
    inventory_migrations = inventory_migrations.resolve()
    project = project.resolve()
    if not inventory_migrations.is_dir():
        raise ValueError("inventory migration directory does not exist")
    if not (project / "supabase" / "config.toml").is_file():
        raise ValueError("target must be an initialized local Supabase project")
    if project.is_relative_to(SUPABASE_DIR.parents[1]) or project.is_relative_to(inventory_migrations.parents[1]):
        raise ValueError("local project must be separate from both source repositories")

    inventory_files = sorted(inventory_migrations.glob("*.sql"))
    hq_files = sorted((SUPABASE_DIR / "migrations").glob("*.sql"))
    test_files = sorted((SUPABASE_DIR / "tests").glob("*.test.sql"))
    if not inventory_files or not hq_files or not test_files:
        raise ValueError("inventory migrations, HQ migrations, and HQ database tests are required")
    if not DATA_ONLY_MIGRATIONS <= {path.name for path in inventory_files}:
        raise ValueError("known production-data migration is missing; review the inventory sequence")

    schema_files = [path for path in inventory_files if path.name not in DATA_ONLY_MIGRATIONS] + hq_files
    names = [path.name for path in schema_files]
    if len(names) != len(set(names)):
        raise ValueError("inventory and HQ migration filenames overlap")

    migrations_dir = project / "supabase" / "migrations"
    tests_dir = project / "supabase" / "tests"
    migrations_dir.mkdir(exist_ok=True)
    tests_dir.mkdir(exist_ok=True)
    extra_migrations = {path.name for path in migrations_dir.glob("*.sql")} - set(names)
    if extra_migrations:
        raise ValueError(f"local project has unexpected migration files: {sorted(extra_migrations)}")
    for source in schema_files:
        copy_unchanged(source, migrations_dir / source.name, refresh)
    for source in test_files:
        copy_unchanged(source, tests_dir / source.name, refresh)
    return len(schema_files), len(test_files)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory-migrations", type=Path, required=True)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--refresh", action="store_true", help="Replace previously copied SQL files with current sources")
    args = parser.parse_args()
    try:
        migrations, tests = prepare(args.inventory_migrations, args.project, args.refresh)
    except ValueError as error:
        parser.error(str(error))
    print(f"Prepared {migrations} schema migrations and {tests} HQ database test file(s).")
    print(f"Excluded inventory data seed: {', '.join(sorted(DATA_ONLY_MIGRATIONS))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
