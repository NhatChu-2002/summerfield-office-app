# Summerfield HQ working instructions

## Branch and promotion flow

- Start each new feature from a clean, freshly pulled `dev`: fetch `origin`, switch to `dev`, run `git pull --ff-only origin dev`, then create a new `feat/*` branch. Do not stack new work on an already merged feature branch.
- Keep changes scoped, commit them on the feature branch, and open a pull request into `dev`. Wait for the relevant CI checks to pass before merging. Do not bypass a failing check.
- Promote the resulting code in order with pull requests: `dev` to `test`, `test` to `stage`, then `stage` to `main`. Verify checks and mergeability at each step. Confirm environment-specific migrations, configuration, and deployment readiness before a stage or production promotion; stop and report a blocker rather than skipping a stage.
- After each merge, verify the remote target branch contains the feature and its post-merge checks pass. Do not push feature code directly to a long-lived branch.

## UI conversion

- Use `docs/design/reference/Summerfield HQ.html` as the visual and interaction reference. Follow the existing React feature-folder structure and shared controls.
- Keep prototype-only data and edits in Design preview until a real API is implemented. Signed-in screens must not present sample records as company data or imply that an unconnected action saves or sends anything.
- Add focused unit tests for nontrivial filtering, validation, and business rules. Run typecheck, import-boundary check, tests, and build before opening a pull request. Check desktop and phone layouts in the browser.
