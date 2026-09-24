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
