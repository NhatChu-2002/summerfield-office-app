# Summerfield HQ MVP

React and TypeScript frontend for department tasks and updates. It uses the same Supabase accounts, organization membership, and department assignments as the Streamlit app. The interface is responsive and has no Claude dependency.

## Design rebuild

The dashboard, shared navigation, and department pages now follow the visual design in `../docs/design/reference/Summerfield HQ.html`. The original file is a design reference, not runtime code. In local development, use **Preview the new HQ design** on the sign-in screen, or **Design preview** in a signed-in workspace, to inspect these screens without writing data. The unauthenticated preview is removed from production builds; signed-in production preview is limited to admins. Preview mode displays all reference departments but cannot read or change company records; normal signed-in views still honor assigned department access.

The navigation also names the other HQ sections from Vy's prototype. Those sections show a clear conversion-pending screen until they are rebuilt; they do not pretend to save data. Calendar, projects, files, Drive links, email, notifications, decision ownership, and the embedded prototype tools are not connected to company services. Local preferences such as the chosen department, hidden dashboard cards, and dismissed tour are saved in this browser.

The next rebuilt screen is **Team Calendar** at `#/calendar`. It includes month/list views, department visibility filters, keyboard-accessible days and events, and a centered event dialog. In design preview, create, edit, and delete temporary all-day or timed events, choose colours, and set weekly, biweekly, monthly, or custom interval repeats. A repeat edit/delete applies to the whole series. Events remain in memory across navigation but clear on reload or exit from preview. Normal signed-in mode has no calendar records or write controls until its API is connected. PDF and Print both open the browser print dialog; PDF uses the browser's Save as PDF destination. Google Calendar, invitations, store-location records, and per-occurrence recurrence exceptions remain disconnected.

Click a date number or the empty space in a month cell to open New event with that date selected. The dialog follows Vy's screenshot: paired calendar/location fields, all-day toggle, colour swatches, optional end date, repeats, team invitation disclosure, where, and notes. A blank end means the start day, including timed events. Location offers company-wide or a manually named preview location; no live store list is queried. Team selections are retained with the temporary event but send nothing. The people picker is explicitly unavailable until its directory is connected. Mobile fields stack and the form scrolls without hiding Save/Cancel.

The calendar module is lazy-loaded and uses FullCalendar 6 with its RRule integration rather than custom recurrence expansion. Run its focused date/validation tests with Node 22.18+ or Node 24: `npm test`. The next UI conversion is **Department folders**, followed by **How HQ works**.

The sign-in and access-check screens use Vy's striped layout and the shared Sunny character rig, with a gentle wing wave behind the body. Unlike the HTML prototype's device PIN, HQ authenticates through Supabase Auth. It reads the existing `organization_memberships` and `team_report_memberships` roles from the inventory app; Team Access remains the place to change an account's department assignments. No role can be chosen on the login form.

In the workspace, click Sunny for a joke or encouraging thought and three floating hearts. Drag her up and release to drop her to the bottom of the visible workspace, above the mobile navigation. The browser animates an accelerating fall with flapping wings, tucked feet, and a soft landing; catching her mid-fall preserves her current position. Hiding her, resizing the viewport, or leaving the workspace cancels the fall. The shared `SunnyCharacter` renderer uses the original artwork with separate wing, foot, body, and expression layers. Wings sit in front of the torso, as in the artwork, and lift cleanly because the body layer has no wing baked into it. Both feet alternate while dragging, and expressions never replace the limbs. Horizontal movement uses a steady directional lean; upward movement uses the back view. Click reactions keep the 820ms, 38px jump with independent wing flaps. Dragging uses direct transform positioning with a fixed step cadence and a direction threshold to avoid jitter. Silhouette-masked lighting and a contact shadow add depth without a 3D runtime. After 90 seconds without interacting with Sunny, she sleeps with slow breathing and drifting Zs; clicking or dragging wakes her. The lower-left Sunny switch and her landed position are saved in this browser. Reduced-motion settings skip the fall, disable character animations, and show static hearts briefly.

Sunny's face is drawn live over the original artwork. Her eyes follow the pointer and blink, the lids and pupils change for happy, wink, surprised, dizzy, drowsy, and sleeping faces, and her beak opens while her lines type out. Vy's heart, glasses, and teary faces are still used for their lines. The dragonfly is a separate layer (`body.webp`, `wing.webp`, and `fly.webp` are generated from `front.webp` by `scripts/split_sunny_layers.py`), so it hovers, lags behind her jumps, and sometimes takes a lap around her head. While she is idle she glances around, tilts her head, stretches, or hops. Rubbing her back and forth with the mouse pets her. She dangles and swings while dragged, and a hard shake leaves her dizzy when she lands. After 35 quiet seconds she may ask for boba (at most once every four minutes); clicking her then gives her a sip. She yawns 9 seconds before napping. She greets you once per browser session.

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

1. Apply `../backend/supabase/migrations/202609220001_hq_mvp.sql` to the target Supabase environment after the existing Summerfield schema migrations.
2. In this folder, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for that environment. The key is public; do not place database passwords or service role keys here.
3. Run `npm install` and `npm run dev`.
4. Sign in with an account already assigned to the organization. Department membership is managed through the existing Team Access page.

Run `npm run build` for a production bundle in `dist/`. The app uses hash routes, so a static host can serve the bundle without route rewrites. Configure the two `VITE_` variables in the build environment.

## Scope

This MVP covers tasks and team updates. It does not yet replace the existing reports, tickets, inventory, calendar, or department prototype tools. Those can move into HQ one workflow at a time while the Streamlit app remains available.
