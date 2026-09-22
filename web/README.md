# Summerfield HQ MVP

React and TypeScript frontend for department tasks and updates. It uses the same Supabase accounts, organization membership, and department assignments as the Streamlit app. The interface is responsive and has no Claude dependency.

## Included workflows

- Sign in and sign out with an existing Summerfield Supabase account.
- See only departments assigned to the account; company admins can see every department.
- Read tasks and updates for accessible departments.
- Create department tasks, set a due date, and assign an active department teammate.
- Complete or reopen a task as its creator, assignee, or department lead.
- Post a department update as a member or lead.
- Switch organizations if the account belongs to more than one.

The database enforces department access with Row Level Security and the `set_hq_task_status` function. The browser uses only the Supabase publishable key. No service role key belongs in the frontend.

## Run locally

1. Apply `../supabase/migrations/202609220001_hq_mvp.sql` to the target Supabase environment after the existing Summerfield schema migrations.
2. In this folder, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for that environment. The key is public; do not place database passwords or service role keys here.
3. Run `npm install` and `npm run dev`.
4. Sign in with an account already assigned to the organization. Department membership is managed through the existing Team Access page.

Run `npm run build` for a production bundle in `dist/`. The app uses hash routes, so a static host can serve the bundle without route rewrites. Configure the two `VITE_` variables in the build environment.

## Scope

This MVP covers tasks and team updates. It does not yet replace the existing reports, tickets, inventory, calendar, or department prototype tools. Those can move into HQ one workflow at a time while the Streamlit app remains available.
