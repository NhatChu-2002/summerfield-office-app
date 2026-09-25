"""Read-only catalog audit for an explicitly identified test Supabase project."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit


SUPABASE_DIR = Path(__file__).resolve().parents[1]
HQ_TABLES = {
    "hq_tasks": {"hq_tasks_read": "SELECT", "hq_tasks_insert": "INSERT"},
    "hq_updates": {"hq_updates_read": "SELECT", "hq_updates_insert": "INSERT"},
}
SHARED_TABLES = ("organizations", "organization_memberships", "user_profiles", "team_report_memberships", "stores", "store_memberships")
HQ_FUNCTIONS = (
    "public.can_read_hq_department(uuid,text)",
    "public.can_write_hq_department(uuid,text)",
    "public.can_manage_hq_department(uuid,text)",
    "public.list_hq_department_people(uuid,text)",
    "public.set_hq_task_status(uuid,uuid,integer,text)",
)


def database_project_ref(database_url: str) -> str | None:
    parsed = urlsplit(database_url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        return None
    username = unquote(parsed.username or "")
    host = parsed.hostname or ""
    if username.startswith("postgres.") and host.endswith(".pooler.supabase.com"):
        return username.removeprefix("postgres.")
    if host.startswith("db.") and host.endswith(".supabase.co"):
        return host.removeprefix("db.").removesuffix(".supabase.co")
    return None


def validate_target(database_url: str, test_ref: str, production_ref: str) -> None:
    if not database_url or not test_ref or not production_ref:
        raise ValueError("HQ_TEST_DATABASE_URL, HQ_TEST_PROJECT_REF, and HQ_PRODUCTION_PROJECT_REF are required")
    if test_ref == production_ref:
        raise ValueError("test and production project refs must differ")
    actual_ref = database_project_ref(database_url)
    if not actual_ref or actual_ref != test_ref:
        raise ValueError("database URL does not identify the declared test project")
    if actual_ref == production_ref:
        raise ValueError("refusing to audit the production project")


def audit(connection, inventory_migrations: Path | None) -> list[tuple[bool, str]]:
    results: list[tuple[bool, str]] = []

    def check(ok: bool, label: str) -> None:
        results.append((ok, label))

    check(connection.execute("show transaction_read_only").fetchone()[0] == "on", "transaction is read-only")
    if not results[-1][0]:
        return results

    tracker = connection.execute("select to_regclass('public.app_schema_migrations')").fetchone()[0]
    check(tracker is not None, "migration ledger exists")
    if tracker is not None:
        applied = {row[0] for row in connection.execute("select name from public.app_schema_migrations")}
        hq_files = {path.name for path in (SUPABASE_DIR / "migrations").glob("*.sql")}
        check(hq_files <= applied, f"HQ migrations recorded (missing: {sorted(hq_files - applied)})")
        if inventory_migrations is not None:
            inventory_files = {path.name for path in inventory_migrations.glob("*.sql")}
            check(bool(inventory_files), "inventory migration directory contains SQL files")
            check(inventory_files <= applied, f"inventory migrations recorded (missing: {sorted(inventory_files - applied)})")
            extras = sorted(applied - hq_files - inventory_files)
            check(not extras, f"migration ledger matches local files (extra: {extras})")

    for table in (*SHARED_TABLES, *HQ_TABLES):
        row = connection.execute(
            "select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace "
            "where n.nspname = 'public' and c.relname = %s and c.relkind in ('r', 'p')",
            (table,),
        ).fetchone()
        check(row is not None, f"public.{table} exists")
        if row is not None:
            check(row[0], f"public.{table} has RLS enabled")

    for table, expected in HQ_TABLES.items():
        if connection.execute("select to_regclass(%s)", (f"public.{table}",)).fetchone()[0] is None:
            continue
        policies = dict(connection.execute(
            "select policyname, cmd from pg_policies where schemaname = 'public' and tablename = %s",
            (table,),
        ))
        check(policies == expected, f"public.{table} policies match read/insert contract")
        for role in ("anon", "authenticated"):
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                allowed = connection.execute(
                    "select has_table_privilege(%s, %s, %s)", (role, f"public.{table}", privilege),
                ).fetchone()[0]
                expected_allowed = role == "authenticated" and privilege in {"SELECT", "INSERT"}
                check(allowed == expected_allowed, f"{role} {privilege} on public.{table}")

    for signature in HQ_FUNCTIONS:
        row = connection.execute(
            "select prosecdef, proconfig from pg_proc where oid = to_regprocedure(%s)", (signature,),
        ).fetchone()
        check(row is not None, f"{signature} exists")
        if row is None:
            continue
        check(row[0] and "search_path=" in (row[1] or []), f"{signature} uses a fixed search path")
        for role, expected_allowed in (("anon", False), ("authenticated", True)):
            allowed = connection.execute(
                "select has_function_privilege(%s, to_regprocedure(%s), 'EXECUTE')", (role, signature),
            ).fetchone()[0]
            check(allowed == expected_allowed, f"{role} EXECUTE on {signature}")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory-migrations", type=Path, help="Path to the inventory app's migration directory")
    args = parser.parse_args()
    database_url = os.getenv("HQ_TEST_DATABASE_URL", "")
    try:
        validate_target(database_url, os.getenv("HQ_TEST_PROJECT_REF", ""), os.getenv("HQ_PRODUCTION_PROJECT_REF", ""))
        if args.inventory_migrations is not None and not args.inventory_migrations.is_dir():
            raise ValueError("inventory migration directory does not exist")
    except ValueError as error:
        print(f"Configuration error: {error}")
        return 2

    try:
        import psycopg
    except ImportError:
        print("Install psycopg[binary] to run the live catalog audit.")
        return 2

    try:
        with psycopg.connect(database_url, connect_timeout=8, autocommit=True) as connection:
            connection.execute("BEGIN READ ONLY")
            try:
                results = audit(connection, args.inventory_migrations)
            finally:
                connection.execute("ROLLBACK")
    except psycopg.Error:
        print("Database audit could not connect or complete its read-only queries.")
        return 2

    for ok, label in results:
        print(f"{'PASS' if ok else 'FAIL'} {label}")
    return 0 if all(ok for ok, _ in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
