# HQ sign-in design QA

- Source: `C:/Users/chunh/AppData/Local/Temp/codex-clipboard-a083373e-8c72-4b04-8230-37df81cb9600.png` (1891 x 972, access-check state).
- Implementation: `http://127.0.0.1:8531/#/` (1900 x 972 desktop and 390 x 844 phone, sign-in state), visually inspected in the in-app browser on September 22, 2026.
- State difference: the source shows a short loading message; the implemented sign-in state adds account and password controls. Both states use the same `AuthFrame`. The transient loading state was inspected in code, but was not separately captured.

## Comparison

- Typography: Caudex wordmark and headings with Work Sans body copy match the HQ reference. The sign-in form uses smaller functional labels.
- Layout: centered white panel, rounded corners, striped sage background, and sloped pale footer match the reference. The sign-in panel is taller because of the form; at 1900 x 972 the whole panel is visible.
- Color: sage background, white panel, and pale blue quote area follow the reference.
- Imagery: the exact Sunny base and wing artwork from the reference HTML loads; the wing waves and Sunny gently bobs. Reduced-motion preference disables the movement.
- Copy: the reference's Claude/PIN explanation was replaced with accurate Supabase account and department-access language.
- Interaction: password visibility toggles correctly, the development-only design preview opens, and the phone layout has no horizontal overflow. Real-account authentication was not exercised because no test credentials were supplied.

Final result: passed for the sign-in visual and local interactions. Live credential and role verification remains a separate authenticated test.

## Team Calendar Rebuild - September 22, 2026

- Reference source: `docs/design/reference/Summerfield HQ.html`, `vCalendar`, `calToggles`, and `evForm`. Existing brand fonts, department colours, navigation, and button styles were retained.
- Scope: `#/calendar`, isolated React module, UI-first. Preview events are in-memory only. No Supabase calendar writes, Google Calendar calls, or invitations.
- Source capture limitation: the in-app browser blocked the local HTML URL. No workaround was used. A matched reference screenshot could not be captured, so exact visual fidelity remains unverified.
- Implementation screenshots inspected at phone width (398px) and desktop (1440 x 1000). Phone defaults to list; desktop defaults to month. The event dialog scrolls internally and keeps its actions visible.
- Verified: create weekly event, display multiple occurrences, department hide/show, edit, time validation, persisted form values, inclusive recurrence cutoff, navigation persistence, keyboard-open event, and confirmed series deletion.
- A date/time input-state mismatch was caught in browser testing and corrected with immediate native input handling. Reopened values and rendered recurrence cutoff were verified afterward.
- Six focused model tests pass, including leap dates, inclusive all-day ends, invalid ranges, overnight duration, biweekly cutoff, and custom recurrence validation. Production build succeeds. The existing main-bundle size warning remains; calendar code is a separate lazy-loaded chunk.
- Not verified: physical printing/PDF output, live account permissions, or external calendar integration. These are not claimed as complete production workflows.
- Functional result: passed for tested local interactions. Visual comparison final result: blocked pending a source calendar screenshot.

Next page: Department folders. Remaining pages continue to show their conversion-pending view.

## New Event Screenshot Match - September 22, 2026

- Source visual truth: `C:/Users/chunh/AppData/Local/Temp/codex-clipboard-1abb0b0f-dada-411d-a167-e25b358b44d8.png` (1843 x 991 including approximately 36px browser chrome).
- Implementation: `docs/design/qa/evidence/calendar-new-event-desktop.png`, captured at 1843 x 955 CSS pixels, approximately 1x device density. The browser output display may rescale the image; layout measurements use CSS pixels.
- State: September calendar, New event, Finance, September 9 start, blank optional end, all-day, department colour, invitations collapsed. Both images were opened together in one comparison input. Full-view and focused form-region comparison were performed from those images.
- Typography: shared Caudex 32px heading and Work Sans 16px form labels/inputs; no changed brand assets. Footer disclosure uses smaller secondary text intentionally.
- Layout: centered 700px dialog, 30px horizontal padding, paired fields, circular swatches, optional end, disclosure, Where and Notes in the reference order. Rounded white surface and shadow follow the source. Close icon and a blurred backdrop retain the app's accessible modal convention.
- Colour and assets: original department palette plus reference olive/pink swatches; white form, charcoal actions, pale borders. Native date icons and Lucide close/diamond are used; no image assets needed for the form. Sunny and existing sidebar assets are unchanged.
- Content differences are intentional: preview-only disclosure replaces the source's shared-edit promise. Location is company-wide or a named temporary location, not a fake live store directory. People selection is disabled with an explicit disconnected message. Team choices are local only.
- Iteration 1: desktop comparison passed; phone paired selects truncated Location and Repeats (P2).
- Fix: stack input grids and invitation choices below 480px.
- Iteration 2: `docs/design/qa/evidence/calendar-new-event-mobile.png` and `docs/design/qa/evidence/calendar-new-event-mobile-notes.png`, 390 x 844 CSS viewport. Select labels fit, lower fields are reachable by internal scrolling, and Cancel/Save remain visible. Field scrollWidth equals clientWidth (326px); no document horizontal overflow. No remaining actionable P0/P1/P2 findings for this dialog.
- Functional verification: blank-cell click, keyboard date activation, date prefill, optional-end save, custom location, colour change, team disclosure, saved HR selection, notes, reopen, invalid timed range rejection, test-event deletion, and Escape close. Browser console error/warning list empty. Synthetic QA event removed; no real data modified.
- Build succeeds and all eight model tests pass. Existing main-bundle size warning remains. No new packages or API calls were added for this update.
- Residual scope: live calendar persistence, people/store directories, outbound invitations, and external calendar integration are not connected. Full-calendar reference fidelity outside the event dialog is not certified by this comparison.

final result: passed

## Calendar Hover and Sunny Sleep Check - September 22, 2026

- Added the reference's whole-date hover treatment to the month grid, with matching keyboard focus feedback. Removed the permanent current-day cell fill; the black current-date circle is unchanged.
- Browser verification in the user's local Edge preview: September 23 hover computed to `rgb(240, 245, 239)`; today remained transparent with a `rgb(35, 31, 32)` date circle. Keyboard focus on September 25 showed the same cell colour. Evidence: `docs/design/qa/evidence/calendar-date-hover.png`.
- Sunny's existing sleep behavior was not broken in this session, so no animation/timer code was changed. Observed sleep initially, clicked to wake (wake response and animation), observed idle after 37 seconds, then sleeping after the full 90-second threshold (observed at 105 seconds). Verified sleepy face, snooze animation, and three sleep marks. User navigation during the wait did not prevent sleep. Evidence: `docs/design/qa/evidence/sunny-idle-sleep-verified.png`.
- Entering/exiting design preview remounts Sunny and starts a fresh idle timer. Normal interactions elsewhere do not restart it. Clicking or dragging Sunny does.
- Build and eight calendar model tests passed; no browser warnings/errors were captured during this check. Existing bundle-size warning is unchanged.

final result: passed

## Compact Event Dialog and Sunny Drop - September 22, 2026

- User refinement supersedes the earlier exact-size dialog target: width 700px to 580px; measured desktop height 905px to 742px. Heading, field padding, gaps, swatches and footer were reduced without removing fields. The reference order, fonts and palette remain intact.
- Desktop (1440 x 1000) and phone (390 x 844) screenshots inspected: `docs/design/qa/evidence/calendar-compact-desktop.png`, `docs/design/qa/evidence/calendar-compact-mobile.png`. Desktop form fits without internal scrolling; phone retains readable 16px inputs, stacked fields, internal scrolling and visible actions. No field horizontal overflow (326px client and scroll widths on phone).
- Sunny drop uses the browser Web Animations API with quadratic acceleration and no per-frame React rendering or physics dependency. Release ends at the viewport floor, clamped around the toggle and above mobile navigation. A fall pose flaps wings and tucks feet; a brief landing squash/bounce follows.
- Browser-tested: desktop fall captured while moving with `fall` motion and `sunny-flap` wings, landing at y=860 in a 1000px viewport, catching mid-fall and re-dropping at a new x position, click showing three animated Lucide hearts, phone drop ending 10px above navigation, and hide/re-enable during a fall. Heart particles are pointer-transparent and removed after 1.2 seconds.
- Reduced-motion, resize and unmount cancellation paths reviewed in code; OS reduced-motion was not changed for browser testing. Idle sleep timer remains 90 seconds and resets on landing.
- Build succeeds. Existing bundle-size warning remains. Scope remains local and calendar preview-only.

final result: passed

## Sunny Expressions and Animation - September 22, 2026

- Live face over `front.webp`: vector whites with the original raster pupils, so the resting face matches the artwork. Checked at 4x scale. Pupils follow the pointer. Lids blink, with an occasional double blink. Added happy, wink, surprised, dizzy, drowsy, and sleepy faces, plus blush and a beak that opens as lines type out. Heart, glasses, and teary sprite faces are unchanged.
- Dragonfly split into `fly.webp` and `front-nofly.webp`. The fur under the dragonfly was filled in using a circle fitted to the head outline. It hovers, lags behind jumps, lifts off during falls, dozes, and takes an idle lap. With the dragonfly away, the head showed no hole or stray pixels.
- Browser-verified with scripted pointer input in the design preview: the click reply types out while the beak chatters, then closes. Dragging swings her with pointer speed. A hard shake gives dizzy eyes, orbiting stars, dust on landing, and the dizzy line. Rubbing with the mouse gives the happy face, blush, nuzzle, hearts, and a pet line. Idle life ran on its own (dragonfly lap, stretch, look-around, blinks). The boba craving appeared at 34s, and clicking showed the cup, sip, and drain. The 4-minute craving cooldown held. Drowsy and yawn came at 81s and sleep at 90s, with a breathing bubble. At 375px the bubble stayed on screen with no horizontal overflow. No console errors.
- Not verified in the browser: OS reduced-motion (reviewed in code only), real touch input, the final "brown sugar boba" line (its timer is set in code; it had already passed when checked), and the greeting's day-specific lines.
- Build and type-check pass. The existing bundle-size warning is unchanged.

final result: passed for tested interactions

## Sunny Wing Layers - September 23, 2026

- Issue: on the sign-in page, the waving wing left a light-blue sliver along the shirt's left edge. The body layer still held the part of the original wing that overlaps the shoulder and shirt corner. The wing's cut shape also trimmed a few pixels off its lower edge.
- Fix: `scripts/split_sunny_layers.py` now also writes `wing.webp` (the complete left wing, mirrored for the right) and `body.webp` (no wings or dragonfly). Under the wings, the neck fur and the shirt, following its measured edge, are filled in. Facing forward, the wings draw in front of the body, as in the art, with their own lighting mask. `front-nofly.webp` was removed. `fly.webp` is unchanged.
- Verified: at rest, the left half matches the original art except along the new layer edges. Checked in the browser at 5x and at actual size: rest, wave up (32°), wave back (6°), and the pet's stretch (56°), flap (38°) and sip poses. No stump, no sliver, and no shirt spike.
- Not verified: the back view (dragging upward) still uses `back.webp`, which has its wings baked in, drawn behind the body as before.

final result: passed

## My Tasks Rebuild - September 23, 2026

- Reference: `vTasks()`, `taskRow()`, `taskList()` and the task dialog in `docs/design/reference/Summerfield HQ.html`. The prototype was served locally and inspected at 1440 x 900. Its standalone mode doesn't keep tasks, so rows were built from its own `taskRow` markup and rendered with its own stylesheet to capture the real look. Row, group, and dialog CSS values were read from the prototype's rules.
- Built: the hero with New task, "Email me my week", "Draft everyone's week" (admins only), and Projects. Groups are Overdue, Today, This week, Later, and Done (last 15), plus "You asked others to do" and the empty state. The prototype's task rows are now the shared `TaskList` on the dashboard, department pages, and My tasks. The New task dialog has a department picker and "Assign to", defaulting to you on My tasks. A details dialog opens from Open.
- Intentional differences:
  - HQ tasks don't store priority, status stages, start dates, locations, projects, files, or comments. Those parts of the row and dialog are left out, and the dialog says so.
  - The email digest buttons are disabled.
  - The prototype's `.btn.pri` clashes with the priority tag's `.pri` class, which shrinks "New task" and "Save task" into tiny pills. Here they use full-size dark buttons.
- Verified in Design preview, with sample tasks relative to today: the grouping, completing a task, and reopening from the details dialog, Escape to close, and creating a task that lands in Today. On a 375px phone, rows stack with Open underneath, the dialog fields stack at 16px, and there's no horizontal overflow.
- Verified signed in, against a local mock Supabase:
  - Only writable departments are offered, and "Assign to" defaults to you.
  - A task delegated to a teammate appears under "You asked others to do" with their name.
  - The checkbox uses `set_hq_task_status` and the task moves to Done.
  - Open shows who asked.
  - Department "Add a task", posting an update, switching organization, and sign-out still work.
  - The console is clean.
- Fixed during testing: the new dialogs closed right after opening in development. React runs effects twice, and the cleanup's `close()` fired `onClose`. The dialogs now open only if not already open and don't close on cleanup.
- Tests: 5 new grouping tests (date boundaries, each group, done limit and order, delegated). All 13 tests pass. Type-check, boundary check, and build pass.
- Not verified: a real Supabase project, and people lookups where a department has no listed members (names fall back to "Teammate").

final result: passed

## Sunny Wing Joint and Stuck Speech Bubble - September 24, 2026

- Wing joint: the shoulder blob from `72e2113` (a fixed gradient shape drawn over each wing root) and its `wing-fur` clip were removed. They hid the joint problems but looked like a pale teardrop pasted on the shirt. The underlying causes are now fixed in `scripts/split_sunny_layers.py`:
  - The shirt's edge under a raised wing is anti-aliased from its measured line instead of cleared pixel by pixel, which made a staircase.
  - Shirt-coloured pixels are faded out of the wing layer, so no tan fringe rides along with the wing.
  - The fill only copies colour from opaque pixels. Before, it could paint a stray dot where it sampled a transparent pixel.
  - The small gap in the art between the head and the top of the wing is filled out to the torso outline, so no notch shows when the resting wing tilts down.
  - The motion changes from `72e2113` are kept: the lagging right wing, the stretch on the flap, and the moved pivot.
- Speech bubble: after a click, grabbing Sunny while her line was typing left the old bubble frozen on screen, and the next line drew over it. The cause was that the speech bubble, the hearts and the landing dust are sibling elements, and each used its own counter as its React key, so all three could be `1` together. React logged "two children with the same key" and lost track of the old bubble. The keys are now `bubble-`, `hearts-` and `dust-` prefixed.
- Verified in the browser: at close range and at normal size in the rest, wave (32°), flap (38°) and stretch (56°) poses, there's no blob, no stepped edge, no tan fringe, and no notch. Two rounds of click, then drag while typing, then land: each press clears the old line, each landing shows exactly one line, and it times out. No console errors.
- Type-check, boundary check, tests and build pass.

final result: passed

## Play with Sunny - September 24, 2026

- Reference: the "Play with Sunny" menu in `docs/design/reference/Summerfield HQ.html` (boba, wiggle dance, hug, nap), with its styles and icons. Added "Let the dragonfly fly" in the same style, and clicking the dragonfly on her head also triggers it.
- Structure: Sunny's position now lives on a wrapper `div`. Her body is still the click and drag button, and the sparkle trigger and menu sit beside it, because HTML doesn't allow a button inside a button.
- Performances: the dragonfly flight (3.4s lap with buzzing wings, while her eyes and head follow it), the dance (sway, stepping feet, floating notes), the hug (two heart beats, wings wrap), the boba sip, and nap (yawn, then sleep). Each starts from rest, runs one at a time, and speaks after the move. A click, a new action, or grabbing her ends the current one cleanly.
- Verified in the browser (design preview):
  - Every action ran with its expected motion, face, and line.
  - A second boba within 60s gets "still full".
  - While she's asleep the menu offers "Wake Sunny up".
  - Escape closes the menu and returns focus. Arrow keys, Home and End move through it.
  - Clicking the dragonfly flies it (even while she sleeps), and clicking her body still gives a thought.
  - A click mid-flight or mid-sip cancels cleanly, with no leftover line or stuck cup.
  - Grabbing her closes the menu.
  - The menu fits at 375px (nudged on screen) and at desktop width.
  - No console errors.
- Not verified: the landing after a drop, after the wrapper change. The browser pane was hidden during that check, which pauses animations. The drop code only changed which element it moves (the wrapper instead of the button), and it was verified before the change.
- Type-check, boundary check, 13 tests and build pass.

final result: passed (drop landing to recheck with the pane visible)

## Sunny Head and Wing Seam - September 24, 2026

- Issue: a patchy look where the wings meet the head and body. There were two causes:
  - The wing's soft inner edge was painted over the tan shirt in Vy's art, so its edge pixels were grey-tan blends. Once the wing moved, they showed as a dirty rim.
  - The resting pose tilted each wing 10° down from the art. That exposed the cut between the wing and head layers, and the head's fuzzy outline, which the art never shows.
- Fix, in `scripts/split_sunny_layers.py`:
  - The wing's edge over the shirt is un-mixed. Each blended pixel is split into its wing share and its shirt share, using the nearby pure wing colour and the shirt colour. The wing keeps pure blue with soft alpha, and the body keeps the shirt share within 2.5px of the shirt's measured edge.
  - Only warm (tan-containing) pixels are treated as blends, so the head's darker blue isn't lightened.
  - The fill's source search now has a guard at the image edge.
- Fix, in `sunny-character.css`: the wings rest at 0°, exactly as drawn. Rest-anchored keyframes and their settle frames move with it. Peak angles (flap 38°, stretch 56°, hug 42°, wave 44°) are unchanged. Sleep and dizzy keep the same droop relative to the new rest (-8° and -12°).
- Verified: offline, the resting pose matches the art in the head, wing and shirt area (92 of 6,560 pixels differ by more than 12, all along soft edges). There are no tan pixels left in the wing layer, and no stray tan beside the shirt. In the browser, close up and at normal size, rest, wave, stretch, and sleep show no seam or rim. The Python preview showed a dotted edge that Chrome doesn't, because Pillow rotates without premultiplied alpha.

final result: passed

## How HQ Works Rebuild

- Source: `docs/design/reference/Summerfield HQ.html`, `vHelp`, guide cards, first-day list, and tour. The React page keeps the blue striped hero, Caudex/Work Sans typography, guide grid, and side column.
- The prototype's Claude PIN, Drive, ticket, SOP, and shared-calendar claims were not copied as working instructions. Guides describe available tasks, updates, dashboard, folders, and calendar viewing; unfinished connections are named plainly.
- The dashboard's Show me around link and the help page open one five-step front-end tour. Its completion marker is local to this browser; no backend writes occur. The page is lazy-loaded.
- Checked desktop and phone browser layouts, the dashboard-to-tour link, modal paging, and phone width without horizontal overflow. The source HTML tab could not be visually compared because browser access to that local file was blocked.
- Build, type-check, boundary check, and all frontend tests pass. Live account permissions and backend guides remain for a later integration pass.

final result: passed for the UI-first scope

## Market Watch Rebuild - September 24, 2026

- Source: `docs/design/reference/Summerfield HQ.html`, Market watch's four tabs, blue striped hero, empty states, setup instructions, saved-item cards, and add/edit dialog. The original prototype was opened through a local HTTP server for comparison.
- Structure: `frontend/src/features/watch/` owns the page, dialog, preview examples, item types, filtering, link validation, and styles. App routes only provide departments and preview state. The page loads in its own chunk.
- In Design preview, sample inbox messages are labeled as examples; no email is read. Adding, editing, removing, filtering, and saving a sample alert change temporary in-memory items. The signed-in workspace shows the screen but clearly marks shared data, email, analysis, and task conversion as unconnected; it does not pretend to save.
- Checked in the browser at desktop and 375px: the hero, tabs, saved-item card, and dialog fit without horizontal page overflow. Keyboard arrows switch tabs. The dialog focuses the title, rejects whitespace-only titles, and saves a valid item. The browser reported no console errors.
- Typecheck, import-boundary check, all 15 frontend tests, and build pass. Real account permissions and backend data were not tested because Market watch has no HQ database or email contract yet.

final result: passed for the UI-first scope

## Market Watch Add Dialog Refinement - September 24, 2026

- Source: the supplied screenshot of the original `Add something` dialog and `docs/design/reference/Summerfield HQ.html` (`watchSave` and `askForm`). The source form measures 560 x 502 CSS pixels; the React form measures 560 x 504 in its open state.
- The React dialog now follows the reference's two-column field order, Caudex heading, Work Sans labels, department icons, exact introductory copy, compact actions, white surface, and grey backdrop. It uses the existing Sunny and shell assets; no image assets were changed.
- Both `Add something` buttons open the dialog. Design preview Save creates a temporary item and Cancel closes the form. In the signed-in workspace the form can be inspected, while Save is disabled with an explicit connection message until shared storage exists.
- Checked desktop and 375px browser layouts. At 375px the fields stack, the dialog scrolls to its actions, and the page has no horizontal overflow. The title receives focus on open. No browser console errors were reported.
- Typecheck, import-boundary check, all 15 frontend tests, and build pass. Signed-in behavior was checked in code; a live account was not available for browser verification.

final result: passed for the UI-first scope

## Shared Dropdown and Date/Time Controls - September 24, 2026

- Replaced browser-native selects and date/time inputs in the workspace shell, Market watch, My tasks, and Team calendar with reusable controls in `frontend/src/shared/ui/`. The source values and callbacks remain unchanged: ISO local dates, 24-hour `HH:mm` times, department codes, and existing form submissions.
- Dropdowns use Radix keyboard navigation and a styled option list. Dates use a lazily loaded DayPicker calendar with minimum-date and clear-date handling. Time uses hour, exact-minute, and AM/PM selections.
- Checked in Design preview at desktop and 375px: Market watch option selection and a saved preview item date, task due-date calendar, Calendar event time, the phone header department menu, popup bounds, focus, and keyboard selection. No horizontal page overflow or browser console errors were observed. Temporary QA item was removed.
- Typecheck, boundary check, all 17 frontend tests, and build pass. The existing main-chunk size warning remains. Signed-in forms and a live Supabase save were not tested.

final result: passed

## Compact Date Picker Navigation - September 24, 2026

- Compared the current React DayPicker navigation options and retained its accessible calendar grid. The shared `DateField` now has a compact month/year header using the app's Radix select controls, plus previous/next month buttons. Day cells and spacing are reduced without changing stored ISO dates.
- In Design preview, selecting February 2030 and a day saved the expected Market watch date. Calendar end-date navigation starts at the event start month; earlier days and months remain unavailable. At 375px the picker measures about 272 x 256 CSS pixels, stays inside the viewport, and causes no horizontal overflow. Browser console errors: none.
- Existing date, time, and form behavior outside the shared date control is unchanged. Typecheck, boundary check, tests, and build pass. No live account save was tested.

final result: passed

## Ownership Pages - September 24, 2026

- Converted `Who to ask` and `Decision chart` from the HTML reference into a shared React ownership feature. Both have the prototype's hero, tabs, search/filter views, owner and decision details, and edit dialogs. The design preview uses labeled sample records and memory-only edits; signed-in views show explicit unconnected states, without invented live assignments or active ticket controls.
- Browser checked ownership search for "ice machine broken," adding an area and navigating to the directory, plus an $800 repair question escalating above a $500 sample limit. Inspected desktop and 375px layouts, including the mobile area dialog. No horizontal overflow was observed. Shared service writes, ticket routing, and a live company directory were not tested because they are not connected.
- Typecheck, import-boundary check, 20 frontend tests, and production build pass. The existing large-chunk build warning remains.

final result: passed

## Projects Pages - September 24, 2026

- Converted the prototype's Projects dashboard and project detail into `frontend/src/features/projects/`, including filters, progress, ticket assignment, task priorities, chat, files, settings, and shared select/date controls. The preview uses labeled sample records and memory-only edits; signed-in screens do not invent shared project data or enable disconnected actions.
- Browser checked desktop Projects and detail layouts, project creation, ticket assignment form, and the 375px dashboard, detail, and form geometry. The phone page has no horizontal overflow; the form scrolls to its actions.
- Typecheck, import-boundary check, 23 frontend tests, and build pass. Shared project persistence, files, Asana synchronization, and a signed-in account were not tested because those services are not connected.

final result: passed for the UI-first scope

## Learning Pages - September 24, 2026

- Converted the prototype's Learning library and lesson reader into `frontend/src/features/learning/`, with team filtering, search, progress totals, takeaways, watchouts, and scored quick-check quizzes. Focused tests cover filtering, summary totals, and complete-answer scoring.
- Design preview uses labeled sample lessons and memory-only progress, scores, and manually written drafts. The draft form does not claim to use Claude. Signed-in views show the unconnected state without sample company lessons or enabled publishing.
- Browser checked the library and reader at phone-pane width, unanswered quiz validation, a correct quiz score, completed status, search, draft creation and removal, and the mobile draft dialog. There was no horizontal page overflow or browser console error. The browser pane did not honor a desktop viewport override, so desktop visual layout was reviewed in CSS but not screenshot-verified.
- Typecheck, import-boundary check, 26 frontend tests, and production build pass. Shared lesson storage, progress persistence, AI writing, and live-account permissions remain untested because those services are not connected.

final result: passed for the UI-first scope

## Time Clock Page - September 24, 2026

- Converted the prototype's Time clock layout into `frontend/src/features/time/`: half-month picker, shift table, live punch panel, team view, and correction-request queue. Preview entries, punches, and requests are memory-only. Payroll export, real HR decisions, and signed-in punches stay disabled until a timekeeping contract exists.
- The React page intentionally does not copy the prototype's legal-rule, waiver, overtime, or premium-pay claims. It displays raw worked time for preview only and says it is not a payroll or compliance determination.
- Browser checked phone-pane layout, clock-in, meal start/end, rest, clock-out, correction validation and submission, request review, table scrolling, and the correction dialog. A visually hidden table header initially caused page overflow; replacing it with an accessible header label removed the overflow. No console errors were observed. Desktop screenshot verification remains unavailable in the narrow in-app browser pane.
- Typecheck, boundary check, 29 frontend tests, and build pass. Focused tests cover leap-year half-month periods, punch states, and open-meal worked-time calculation.

final result: passed for the UI-first scope

## Monthly Reports Pages - September 24, 2026

- Converted the prototype's report overview and department editor into `frontend/src/features/reports/`. A typed schema owns each team's question groups; shared executive fields and completion rules live in the feature model. The React UI includes month selection, preview status, executive highlights, report editing, submission/reopen, presentation, and preview CSV content generation.
- Design preview uses labeled sample records and memory-only edits. Signed-in views do not show sample performance or enable shared report actions. Prototype goals, target-health scoring, AI-written summaries, automatic task creation, and live HQ activity totals were not represented as working features without their source contracts.
- Browser checked overview and editor at phone-pane width, required-field validation, field edits, submitted locking, presentation, and selected-month routing across navigation. No horizontal page overflow was observed. The in-app browser did not expose a download event for the preview CSV; its rows, quoting, and spreadsheet-formula protection were unit-tested. Desktop screenshot verification remains unavailable in the narrow pane.
- Typecheck, boundary check, 33 frontend tests, and build pass. Shared storage, actual report permissions, and a live account were not tested because they are not connected.

final result: passed for the UI-first scope

## Meetings Page - September 24, 2026

- Converted the prototype's Meetings page into `frontend/src/features/meetings/`, with typed meeting records, search and department filtering, agenda/notes/decisions, action-item summary, and a meeting editor using the shared date, time, and select controls.
- Preview has labeled sample records and memory-only edits. Signed-in views show an explicit unconnected state; Drive import, email recap, and AI answers are disabled. Action lines do not create HQ tasks or claim to be tracked.
- Browser checked the phone-pane layout, editor geometry, creating a meeting, action summary update, and search results. The narrow pane shows a small pre-existing top-bar overflow; Meetings content stays within the page. Desktop visual verification and connected service flows remain untested.
- Typecheck, import boundaries, 37 frontend tests, and production build pass. Focused tests cover line parsing, search/sort, action source, and web-link safety.

final result: passed for the UI-first scope

## SOP Studio Page - September 24, 2026

- Converted the prototype's SOP Studio into `frontend/src/features/sop/`: a typed draft model, manual house-format editor, checklist, filing handoff, and preview draft library. The form supports repeatable roles, procedure steps, related documents, approvals, and version history.
- Design preview holds drafts in memory. Raw notes are kept as reference material, not processed by Claude. File import, Word generation, shared approvals, and Drive upload are disabled; the preview-only filed status requires a valid web link and a complete checklist.
- Browser checked the phone-pane start form, draft from pasted notes, procedure editing, save/reopen, checklist state, and mobile row geometry. The page content does not overflow horizontally; the existing narrow top bar still exceeds the pane by about 5px. Desktop visual verification and connected service flows remain untested.
- Typecheck, import boundaries, 43 frontend tests, and production build pass. Focused tests cover SOP numbering, steps, placeholders, date validity, completeness, text export, and link safety.

final result: passed for the UI-first scope

## People & Access Page - September 24, 2026

- Converted the final prototype sidebar page into `frontend/src/features/people/`. The feature owns a typed preview roster, role ordering/search, department toggles, person details, and sample access requests.
- All preview role/department edits are memory-only and explicitly do not grant access. Signed-in admins see only their actual organization role and visible departments in a read-only summary; non-admins receive a restricted view. The desktop rail and mobile More/Search sheet now share the admin-only navigation filter.
- Browser checked phone-pane roster, department disclosure/toggle, role change, add-by-name dialog, sample request handling, search, and narrow layout. The shared top bar now wraps below 380px so the previously observed 5px overflow is removed. The Who to ask shortcut to this page follows the same admin visibility rule as the main navigation. A live signed-in account and actual access-management service were not available for browser testing.
- Typecheck, boundary check, 46 frontend tests, and production build pass. Focused tests cover role sorting, search, and department toggling.

final result: passed for the UI-first scope

## Locations Pages - September 24, 2026

- Converted the prototype's location list and five-tab location file into `frontend/src/features/locations/`. The feature owns typed location/equipment records, search, location and equipment editors, folder links, history from recorded opening/install dates, a local equipment CSV export, and focused tests.
- Design preview uses labeled sample locations and memory-only edits. Signed-in views show an explicit unconnected state instead of sample company records. Shared storage, catalog synchronization, actual file attachments, audits, and location calendar events are not connected.
- Browser checked the phone-pane list, detail overview, equipment tab and editor, saving preview equipment, and horizontal width. The page remained within the 347px viewport. Desktop screenshot verification and signed-in service flows remain untested.
- Typecheck, import-boundary check, frontend tests, and production build pass. CSV tests cover quoting and spreadsheet-formula protection.

final result: passed for the UI-first scope

## Master Equipment Catalog - September 24, 2026

- Converted the prototype's equipment, smallwares, supplies, vendors, brand standards, and recent-change views into `frontend/src/features/catalog/`. The feature owns typed records, filtering, change tracking, web-link validation, and vendor-grouped order CSV with spreadsheet-formula protection.
- Design preview uses labeled sample catalog data and memory-only edits. Signed-in mode shows no invented company inventory. Excel import, shared catalog storage, vendor integration, and synchronization into location equipment are not connected.
- Browser checked the phone-pane page and editor, a price edit and audit entry, I&M dashboard navigation, and horizontal width. The page stayed within the 347px viewport. Desktop screenshot verification and connected service flows remain untested.
- Typecheck, import-boundary check, frontend tests, and production build pass.

final result: passed for the UI-first scope

## Departments Index - September 24, 2026

- Converted the prototype's Departments index to a shared React card grid and connected its previously missing Design preview route. Preview lists reference teams, while signed-in mode keeps the account's assigned departments and live open-task counts.
- Browser checked the phone-pane index, reference department links, and horizontal width. Typecheck, import-boundary check, frontend tests, and production build pass. A signed-in account was not available for browser testing.

final result: passed for the UI-first scope

## Connected Ticket Desk - September 25, 2026

- Added a separate signed-in Ticket desk at `#/tickets`, linked from Projects, using the inventory ticket RPCs. The existing Design preview remains memory-only. The queue, submission form, and detail/activity views do not present sample tickets as company records.
- Checked the local synthetic admin workflow in the browser: submitted a store ticket, moved it to Acknowledged with a note, assigned the QA user, and saw both events. At 351px and 1528px viewport widths, the document had no horizontal overflow; the browser reported no console errors. A small-screen empty-state spacing and optional-note label were adjusted after inspection.
- This is not a hosted deployment verification. Ticket photos, project links, chat, and notifications remain outside this slice.
- Store-manager phone follow-up: a synthetic manager assigned only Store One opened the form from mobile More > Projects, saw only Store One in the picker, submitted a local ticket, reopened it, and found it in their own queue. The Phone layout initially kept desktop queue columns, and Sunny intercepted a submit tap near the form action. Ticket breakpoints now respond to the feature's container width, and the pet/toggle are hidden while the phone ticket form is active. The 424px Phone pane showed stacked fields and a readable queue after the fix; desktop retained two-column fields. Physical-device touch was not separately tested.

## Ticket Access and Projects Route - September 26, 2026

- The inventory ticket contract let a lead assign an active teammate, but its read helper still recognized only reporter and reviewer. A new inventory-owned migration adds active-assignee read access consistently to queue/detail, activity, photo metadata, and storage object policies; assignees still cannot change status or assignment. Isolated clean replay covered 47 schema migrations and the HQ ticket pgTAP checks, including access loss after unassignment. Hosted deployment remains pending migration-ledger reconciliation.
- Signed-in Projects now has a separate route component with links to the live Ticket desk and HQ tasks. It does not display sample project records or offer unsaved project editing. The existing preview Projects page retains memory-only sample edits. A synthetic local store manager opened both connected Projects and the Ticket desk in the browser; the Phone pane showed stacked actions without horizontal overflow, and preview Projects still showed its sample records and editor actions.
- At this earlier slice, project ownership and persistence were still undecided. The foundation below records the later decision. Actual-device touch testing and a hosted, post-migration assignee login remain open.

## Shared Projects Foundation - September 26, 2026

- Product decision: HQ-owned Supabase records are the source of truth; Asana is an optional outbound link. New `hq_projects` migration keeps browser writes behind revision-checked RPCs and department access rules. There is no hard delete; leads/admins can archive and restore.
- Clean unlinked replay applied 48 migrations and passed 136 pgTAP assertions across four files. Project coverage includes viewer read-only access, member creation, active owner/creator/lead edits, store-manager and other-department denial, inactive/cross-organization denial, writer-only owner eligibility and picker results, stale and missing revisions, invalid links and dates, and archive/restore. CI also has offline checks for code constraints and grants; it still does not execute migrations.
- The connected list and detail routes read real project rows. A signed-in store-only manager saw no create action in desktop and Phone browser panes while the Ticket desk remained accessible. A separate synthetic department lead created a local project, opened its detail, changed status and description, archived it, and found it with the Archived filter. The Phone pane kept the list usable, and the new-project modal was constrained to phone width after visual inspection. The local QA database received the project SQL directly without resetting its synthetic data; that action was not recorded in its migration ledger. No hosted database was changed.
- Deferred: project-linked HQ tasks, participants, files, chat, Asana sync, server-side project search/pagination beyond the latest 200 records, actual-device touch, and a hosted test after migration-ledger reconciliation.
