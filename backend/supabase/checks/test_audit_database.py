import unittest

from audit_database import database_project_ref, validate_target


TEST_REF = "aaaaaaaaaaaaaaaaaaaa"
PRODUCTION_REF = "bbbbbbbbbbbbbbbbbbbb"


class DatabaseTargetTests(unittest.TestCase):
    def test_pooler_url_identifies_project_without_using_password(self):
        url = f"postgresql://postgres.{TEST_REF}:secret@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
        self.assertEqual(database_project_ref(url), TEST_REF)
        validate_target(url, TEST_REF, PRODUCTION_REF)

    def test_direct_url_identifies_project(self):
        url = f"postgresql://postgres:secret@db.{TEST_REF}.supabase.co:5432/postgres"
        self.assertEqual(database_project_ref(url), TEST_REF)

    def test_production_and_mismatched_targets_are_rejected(self):
        url = f"postgresql://postgres.{PRODUCTION_REF}:secret@aws-0-us-west-2.pooler.supabase.com/postgres"
        with self.assertRaises(ValueError):
            validate_target(url, TEST_REF, PRODUCTION_REF)
        with self.assertRaises(ValueError):
            validate_target(url, PRODUCTION_REF, PRODUCTION_REF)

    def test_unknown_database_identity_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_target("postgresql://postgres:secret@localhost/postgres", TEST_REF, PRODUCTION_REF)
        with self.assertRaises(ValueError):
            validate_target(f"postgresql://postgres.{TEST_REF}:secret@localhost/postgres", TEST_REF, PRODUCTION_REF)


if __name__ == "__main__":
    unittest.main()
