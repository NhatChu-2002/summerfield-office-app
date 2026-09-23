# Infra

This part covers how HQ is hosted, configured, and checked. The rules for the whole repo are in `../CLAUDE.md`.

- **`render.yaml`** is the Render Blueprint. It defines the frontend Static Site. The API Web Service is written out but commented until its first real endpoint ships. **It is not connected to Render yet.**
- **`README.md`** covers the environments, every environment variable, and the deploy and rollback steps.
- **CI** lives in `../.github/workflows/`, because GitHub only reads workflows from there. There is one workflow per part, and each runs only when that part's files change:
  - `frontend.yml`
  - `backend-api.yml`

## Rules

- **No secret values in this folder, ever.** Variables whose values are secret use `sync: false` in `render.yaml` and are entered in the Render dashboard.
- **Document every new environment variable** in `README.md`, in the part's `.env.example` (as a placeholder), and in `render.yaml`.
- **Keep deploys independent.** Each service builds from its own `rootDir`, so a frontend change never rebuilds the API and the reverse.
- **Database migrations are not deployed by CI.** They are applied by hand, test project first (see `../backend/CLAUDE.md`). Deploy a migration before the frontend or API that depends on it.
- **The existing inventory app's Render services are outside this repo.** Nothing here may change them.

## Unverified

These settings haven't been checked against a live Render or GitHub account yet. Check them when connecting:

- The Blueprint file path (`infra/render.yaml`).
- Static-site header support.
- The CI workflows. There is no Git remote yet.
