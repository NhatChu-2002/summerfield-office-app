# Frontend

This is the React single-page app that staff use. It builds to static files in `dist/`. It talks to Supabase with the signed-in user's session, and later it will talk to `backend/api`. The rules for the whole repo are in `../CLAUDE.md`.

**Stack:** React 19, TypeScript (strict), Vite 7, `@supabase/supabase-js`, FullCalendar 6 with RRule, and lucide-react icons. Styles are plain CSS, with no framework.

## Layout

```
src/
├── main.tsx                     mounts <App/>, loads global CSS
├── app/                         composition: which providers wrap the app, which page shows for each route
│   ├── App.tsx                  providers + the gate: sign-in → access check → preview or workspace
│   ├── AppRoutes.tsx            route table for the signed-in workspace; hands each page its data
│   ├── PreviewApp.tsx           "Design preview": every screen, no company data, nothing saved
│   └── providers/
│       └── HqDataProvider.tsx   tasks + updates for the active organization, refresh, task actions
├── features/                    one folder per product area
│   ├── auth/                    session (SessionProvider, useSession), access and roles, sign-in pages
│   ├── dashboard/               home page and department cards
│   ├── departments/             department page, department grid, Vy's department layout
│   ├── tasks/                   hq_tasks data, grouping rules + tests, task rows, new-task and details dialogs, My tasks page
│   ├── updates/                 hq_updates data, list, composer, updates page
│   ├── calendar/                team calendar (lazy-loaded), recurrence model + tests
│   ├── workspace/               app shell: rail, top bar, mobile tabs, placeholder page
│   └── sunny/                   the mascot: drawing rig and on-page behaviour
└── shared/                      no product knowledge: usable by any feature
    ├── api/supabase.ts          the only Supabase client, plus dataOrThrow()
    ├── config/                  departments, Vy's department colours and folders
    ├── lib/                     format, hash routing, useMyDepartment
    ├── ui/                      Notice, Panel, ComingSoonButton, toast, icons
    └── styles/global.css        design tokens and app-wide styles
```

### Inside a feature

Create only the parts a feature needs:

```
features/<name>/
├── index.ts          the feature's public API: the ONLY file other code may import from
├── api.ts            Supabase calls for this feature, plus row types that mirror the database
├── model.ts          pure logic (sorting, permissions, validation); no React, no network
├── model.test.mjs    tests for model.ts (Node's test runner)
├── <name>.tsx        a provider or hook, when the feature owns shared state (auth/session.tsx)
├── components/       pieces of UI used by this feature's pages or exported for others
└── pages/            full screens that a route renders
```

When `api.ts` or `model.ts` outgrows one file, turn it into a folder with its own `index.ts`.

## Dependency rules

`npm run check:boundaries` enforces these, and CI runs it:

1. **Direction is `app → features → shared`.** `shared/` never imports from `features/` or `app/`. Features never import from `app/`.
2. **Features talk to each other only through `index.ts`.** Write `import { TaskList } from '@/features/tasks'`, never `'@/features/tasks/components/TaskList'`.
3. **Inside a feature, use relative imports** (`../api`). A feature never imports its own `index.ts`.
4. **Use the `@/` alias for anything outside the current feature.** No `../../` imports.
5. **Before adding an export to `index.ts`, ask whether another feature really needs it.** A small public API keeps features independent.

Pages don't fetch app-wide data themselves. `AppRoutes` reads it from providers and passes it in as props, so a page can be rendered in preview with empty data or reused elsewhere. A page may call its own feature's `api.ts` for actions (like `UpdateComposer` posting an update).

## Data and state

- **Supabase calls live only in a feature's `api.ts`,** using `requireSupabase()` and `dataOrThrow()`. Components never call Supabase directly.
- **Row types mirror database columns in snake_case.** When a migration changes a table, update the type in the same change as the UI that uses it.
- **`SessionProvider` (auth)** owns the session, the active organization, and the person's access.
- **`HqDataProvider` (app)** owns tasks and updates. It is mounted with `key={userId:organizationId}`, so switching organization starts fresh and late responses for the old one are dropped. When you add a new kind of data, give it a provider that follows the same pattern.
- **Permission helpers only shape the UI:** `departmentRole`, `canWriteDepartment`, and `canChangeTask`. Row Level Security in the database is the real check, so show the server's error rather than assuming success.
- **Browser-only preferences stay local.** Things like "my department", hidden dashboard cards, and Sunny's position go in `localStorage`, through small hooks such as `useMyDepartment`. Wrap storage access in `try`.
- **There is no global store library.** Providers and props are enough at this size.

## Adding a screen

1. Create `features/<name>/pages/<Name>Page.tsx`. Add `api.ts` and `model.ts` if it has data or rules.
2. Export the page from `features/<name>/index.ts`.
3. Add its route in `app/AppRoutes.tsx`. Add it to `app/PreviewApp.tsx` too, using empty data, so it can be seen in Design preview.
4. If it's large (like the calendar), export it with `lazy()` from `index.ts` so it loads in its own chunk.
5. Add its styles next to the page. Tests for its `model.ts` go beside it.

## Design preview

The sign-in screen offers **Preview the HQ design** in development builds only. Signed-in admins get **Design preview** in the workspace. Preview uses `previewAccess` in `app/PreviewApp.tsx` and must never read or write company data. Calendar events in preview live in memory only.

## Styling

- **Global tokens and base styles** are in `shared/styles/global.css`. A feature's styles sit beside the component or page that imports them.
- **`features/workspace/components/workspace.css`** holds Vy's HQ design for everything inside the shell: rail, dashboard, and department pages. It's loaded by `WorkspaceShell`. The `vy-` class prefix marks those design-system classes, so keep it for new classes in that design.
- **Fonts and colours:** Caudex for headings and Work Sans for body text. Department colours come from `reference-departments.ts` (use `departmentStyle(color)`).
- **Reduced motion:** every animation needs a `prefers-reduced-motion: reduce` fallback.

## Sunny

- **`components/SunnyCharacter.tsx`** layers the artwork (`public/sunny-pet/*.webp`) and draws a live face over it. The eye, beak, and cheek coordinates are measured from `front.webp`, so re-measure them if the art changes.
- **`body.webp`, `wing.webp`, and `fly.webp`** are layers split from `front.webp` by `scripts/split_sunny_layers.py`, which needs Python with Pillow and NumPy. The body has the wings and dragonfly removed, and the fur and shirt under them filled in, so nothing is left behind when they move. Rerun the script whenever `front.webp` changes. Facing forward, the wings draw in front of the body, as in the art. The right wing is the left one mirrored.
- **`components/SunnyPet.tsx`** is her behaviour on the page. Gaze and swing are CSS variables, so pointer tracking doesn't re-render React. Timers read state through the `live` ref. Clear every timer you add on unmount and when she is toggled off.

## Checks

```bash
npm run typecheck
```

```bash
npm run check:boundaries
```

```bash
npm test
```

```bash
npm run build
```

- **Tests** are `*.test.mjs` files beside the code they test, run with Node's built-in runner. They need Node 22.18 or newer, which imports `.ts` directly. Keep tested logic in plain `.ts` modules with no React, and only type imports through `@/`.
- **Before calling a UI change done,** check it in the browser: Design preview at desktop and 375px widths, keyboard use, and no console errors.
- **The main chunk is over 500 kB, so the build warns.** This is known. Split new large screens with `lazy()` as the calendar is.

## Environment

Copy `.env.example` to `.env.local`. Only `VITE_`-prefixed variables reach the browser, and every one of them is public. Never put a service-role key or password here.
