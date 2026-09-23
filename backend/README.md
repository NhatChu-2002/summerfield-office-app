# Summerfield HQ backend

- **`supabase/migrations/`** holds HQ's database schema, access policies, and functions. Apply these files in order to a **test** Supabase project that already has the inventory app's schema, then to production. They cannot run on an empty database.
- **`api/`** is a FastAPI service for server-side work: integrations, secrets, and scheduled or heavy jobs. It is a skeleton today, with only a health check, and is not deployed yet.

See `CLAUDE.md` in this folder for the security pattern, migration rules, and commands.
