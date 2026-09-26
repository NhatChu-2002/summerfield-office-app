import tempfile
import unittest
from pathlib import Path

from prepare_local import DATA_ONLY_MIGRATIONS, SUPABASE_DIR, prepare


class PrepareLocalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.inventory = root / "inventory" / "supabase" / "migrations"
        self.inventory.mkdir(parents=True)
        (self.inventory / "202609090001_initial_schema.sql").write_text("select 1;")
        (self.inventory / next(iter(DATA_ONLY_MIGRATIONS))).write_text("select 2;")
        self.project = root / "local"
        (self.project / "supabase").mkdir(parents=True)
        (self.project / "supabase" / "config.toml").write_text("project_id = 'local-test'\n")

    def test_copies_schema_and_tests_without_data_seed(self):
        count, tests = prepare(self.inventory, self.project)
        self.assertEqual(count, 1 + len(list((SUPABASE_DIR / "migrations").glob("*.sql"))))
        self.assertGreater(tests, 0)
        self.assertFalse((self.project / "supabase" / "migrations" / next(iter(DATA_ONLY_MIGRATIONS))).exists())
        self.assertEqual(prepare(self.inventory, self.project), (count, tests))

    def test_refuses_modified_copy(self):
        prepare(self.inventory, self.project)
        (self.project / "supabase" / "migrations" / "202609090001_initial_schema.sql").write_text("changed")
        with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
            prepare(self.inventory, self.project)
        prepare(self.inventory, self.project, refresh=True)
        self.assertEqual((self.project / "supabase" / "migrations" / "202609090001_initial_schema.sql").read_text(), "select 1;")

    def test_refuses_unexpected_migration(self):
        prepare(self.inventory, self.project)
        (self.project / "supabase" / "migrations" / "unexpected.sql").write_text("select 1;")
        with self.assertRaisesRegex(ValueError, "unexpected migration"):
            prepare(self.inventory, self.project)

    def test_refuses_same_version_with_different_filenames(self):
        hq_version = next((SUPABASE_DIR / "migrations").glob("*.sql")).name.split("_", 1)[0]
        (self.inventory / f"{hq_version}_inventory_conflict.sql").write_text("select 1;")
        with self.assertRaisesRegex(ValueError, "migration versions overlap"):
            prepare(self.inventory, self.project)


if __name__ == "__main__":
    unittest.main()
