# Wildself — Plan of Action

_As of 2026-11-24 · "Wildself" is a working name_

We will build a React Native (Expo) habit tracker that gets people outdoors. The work runs in **18 phases (Phase 0–17)**, one feature at a time. Each phase goes **Frontend → Backend → Database migrations → Rigorous testing → Update and deployment**.

> **Status (2026-11-24): Phase 0 in progress.** Frontend: design approved; after the smoothness changes you found it much smoother in production mode; 120 fps still to be confirmed on a production build. Backend and database stages built and tested (100 tests pass, including 6 on your local PostgreSQL); the API, worker and migration tool were run against your local database, and the first migration ran on `wildself_dev`. Testing and deployment stages not started. Phases 1–17 not started. Code is on GitHub: `chvsaditya-wq/Wildself`.

This file is the overall plan and progress tracker. The detailed docs:

| Doc | Covers | Status |
| --- | --- | --- |
| [FRONTEND.md](FRONTEND.md) | Design system, motion, performance rules (120 fps), navigation, screens | Phase 0 foundations built; some choices to confirm |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Backend: layers, 6 engines, ticket system, efficiency rules, midnight pipeline, offline data, security rules, approved stack, API | Stack approved; Phase 0 backend built |
| [DB.md](DB.md) | Tables, who supplies each value, data-layer operations, migrations, data growth and retention | Phase 0 tooling built; feature tables start in Phase 1 |
| [IMPROVEMENTS_LOG.md](IMPROVEMENTS_LOG.md) | Per phase and part: plan, what was built, required changes, comparison table; log of every instruction | Started 2026-11-24 |

If this file disagrees with a detailed doc, the detailed doc wins.

---

## 1. Progress checklist

Tick a stage only when its exit check (Section 8) passes. A phase is done when all five stages are ticked and you have signed off.

### Phase 0 — Foundations

- [ ] Questions answered and rules confirmed
- [ ] Frontend: Expo repo, design tokens, base components, tab shell (Home, Discover, Analytics, Settings), slide-out menu shell, offline action queue
  - 2026-11-23: built in `apps/mobile` (Expo SDK 58). Typecheck, lint, expo-doctor (20/20) and 45 unit tests pass; Android and iOS bundles build.
  - 2026-11-24: reviewed on your phone. **Design approved.** **120 fps not reached** → press feedback moved to native code, indicators start on the tap, iOS 120 Hz key added, production-mode test script added (IMPROVEMENTS_LOG.md, Frontend Phase 0). All checks still pass.
  - 2026-11-24: you re-tested with `npm run mobile:perf`: **much smoother**.
  - [x] Design and layout approved (2026-11-24)
  - [x] Smoothness re-test in production mode (2026-11-24)
  - [ ] 120 fps confirmed on a production build on a 120 Hz phone (needs the development build below)
- [ ] Backend: one build with `api` and `worker` roles, internal API interface, scheduler skeleton, auth wiring
  - 2026-11-24: built in `services/backend` with `packages/contracts`, `packages/internal-api`. Fastify 5 API with health checks, `/v1/session`, request ids, security headers, rate and size limits, safe error format; worker with minute scheduler, single-leader lock and heartbeat; fail-fast config; Sentry with all personal-data collection off; auth interface with `deny-all` default and a development-only stub. 37 backend tests pass; production build (21 KB) starts and answers.
  - 2026-11-24: run against your local PostgreSQL: `/health/ready` reports the database ok; login is required on `/v1/session` and on unknown routes; of two workers started together, only one became leader and its heartbeat ran on the minute.
  - Still to tick: the layer-boundary lint (Testing stage).
- [ ] Database: PostgreSQL environments (local / staging / prod), migration tool, data-layer skeleton, monthly partition creation
  - 2026-11-24: `packages/data` (pool with UTC and timeouts, ping, advisory leader lock), forward-only SQL migrations with node-pg-migrate, CI check that rejects logic in migrations (12 tests), local setup guide, 6 integration tests ready.
  - 2026-11-24: you set up local PostgreSQL. All 6 integration tests pass (4 runs in a row); 3 had failed at first because of mistakes in the tests, now fixed (IMPROVEMENTS_LOG.md, DB Phase 0). `db:migrate` ran (safety check, connection, nothing to apply yet).
  - 2026-11-24: you fixed the `DATABASE_URL` password in `.env`; `npm run db:migrate` ran on `wildself_dev`. **Local environment done.**
  - Still to tick: staging and production databases come with the deployment stage. Monthly partition creation moves to Phase 3, where the first partitioned table appears.
- [ ] Testing: CI pipeline, lint rules that enforce the layer boundaries
- [ ] Deployment: EAS dev builds (with the Android highest-refresh-rate setting and the iOS 120 Hz key), staging API and worker deployed, Sentry

### Phase 1 — Accounts and onboarding

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 2 — My Habits: create, edit, delete, schedules, time windows

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 3 — Home screen, daily ticking, Habit tracker engine, midnight pipeline

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 4 — Step tracker engine, Steps tile, walks

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 5 — Water tracker engine and Water tile

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 6 — Mana engine (habits, steps, water, deletion penalty) and Profile

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 7 — Ticket system: spend mana to cover days

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 8 — Habit reminders: time windows and end-of-day reminder

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 9 — Image search engine and personal collection (Discover, top section)

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 10 — Mana engine: pictures, learning, month-end bonus

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 11 — Daily challenges: Home card, challenge page, bookmark, saved in Profile, Discover section

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 12 — Analytics engine and Analytics tab

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 13 — Private journal

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 14 — Nature calendar

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 15 — Special challenges (Discover, bottom section)

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 16 — Rewards

- [ ] Questions answered and rules confirmed
- [ ] Frontend · [ ] Backend · [ ] Migrations · [ ] Testing · [ ] Deployment

### Phase 17 — Launch

- [ ] Load test of the midnight pipeline (100,000 users in one time zone)
- [ ] Store listings, privacy policy, terms
- [ ] Accessibility and performance pass
- [ ] App Store and Google Play release

---

## 2. Vision and principles

The app helps people step away from work and screens, spend time in parks, lakes and wild places, and notice what lives there. Progress should feel like a growing record of experiences, not a points grind. The feeling to aim for: rediscovering your own nature by being part of the wild.

**Core loop:** log in → create habits → do them and tick them off each day → keep a streak → earn mana at midnight → level up → look back at a calendar full of encounters.

Rules that apply to every feature:

1. **Smoothness is non-negotiable: 120 fps** on every 120 Hz phone. Light, fluid, tactile; see FRONTEND.md §7.
2. **Habits are ultimate.** A day not logged is missed, never skipped. Deleting a habit costs a fixed amount of mana. Only a ticket bought with mana can cover a day.
3. **No signal is never the user's fault.** Offline actions count for the moment they happened.
4. **Calm over compulsion.** No red badges, guilt copy or confetti.
5. **Outdoors first.** Time outside (walks, pictures, challenges) counts for more than time on the phone.
6. **Every record has context.** A photo always carries species, date, time, place and season.
7. **Fetch once, keep forever; keep only what is used.** A species is looked up once. Detail that stops being useful is deleted on a schedule.
8. **Opt-in extras.** Special challenges, saved challenges and step goals are optional; ignoring them changes nothing.
9. **Strict layers, efficiently connected.** Engines calculate, the database stores and counts, the API is the only path between them; work is batched and saved atomically.
10. **Security first** (2026-11-24). Every phase follows ARCHITECTURE.md §3.6; no improvement is accepted if it weakens security, and every testing stage includes security tests.

---

## 3. Features by phase

Items marked **(to confirm)** need your rules before they are built.

### Phase 1 — Accounts and onboarding

- Sign up and log in (method to confirm).
- Onboarding: name, avatar (optional), height and weight (optional; used by the step tracker), location permission (coarse by default).
- **Done when:** a new user can sign up, log out, log in on another device and see the same data.

### Phase 2 — My Habits

- **My Habits** in the slide-out menu is the only place to create, edit and delete habits.
- **Schedules:** all days, all days except Sunday, or custom days of the week.
- **Time window (optional):** start and end time.
- **Delete:** removed immediately with all its history; only a count of deleted habits remains; a **fixed mana penalty** (from Phase 6). Proposed: the confirmation shows the penalty.
- **Done when:** create, edit and delete work across devices, and a deleted habit leaves only its deletion record.

### Phase 3 — Home screen, Habit tracker engine, midnight pipeline

- **Home** (from your sketch): hamburger menu, greeting, profile icon, daily challenge card, **Steps** and **Water** tiles (words only until Phases 4 and 5), habits scroll box.
- Only habits scheduled for today appear. Tapping the tick mark **or** the name completes a habit: struck through and very light. Tapping again undoes it, until 23:59.
- **Offline ticks count:** stored with the time of the tap on the phone and sent when the signal returns. If they arrive after midnight (up to 7 days), the closed day is amended, mana is replayed, and the user is told calmly.
- **Batched sync:** all waiting actions go in one request (`POST /sync`), under the security rules in ARCHITECTURE.md §3.5 (identity from the token only, ownership checks, size and rate limits, per-action results, replay-safe).
- **Streaks:** at least 2 days. A day not logged is missed.
- **Habit tracker engine:** today's habits, day close at 00:00 in the phone's current time zone, daily / weekly / monthly counts.
- **Midnight pipeline:** closes days in batches of users, each saved in one transaction. Dormant users (14 days) are paused and caught up as missed days when they return.
- **Done when:** each day closes exactly once, counts match hand-worked examples for all three schedule types, late ticks amend correctly, and a batch of 500 users closes in one read and one write.

### Phase 4 — Step tracker engine

- Reads steps from Apple HealthKit and Android Health Connect and syncs them during the same day.
- **All-day steps** fill the Steps tile and count toward the optional step goal.
- **Walks:** a small Start / Stop button on the Steps tile. A forgotten walk ends after 20 minutes without steps; 4 hours at most; split at midnight. No GPS.
- BMI-based figures (distance, rough calories) from height and weight.

### Phase 5 — Water tracker engine

- Tapping the **Water** tile adds a glass; a **+** button next to the glass does the same.
- Closes each water day at 00:00; fills the Water tile. Goal and undo rules **(to confirm)**.

### Phase 6 — Mana engine and Profile

Planned together with the step and water trackers, since both feed it.

- **1 mana per day** if all habits scheduled that day were completed, assigned at **00:00**.
- **Multiplier:** +0.25 per day of unbroken streak, **starting on day 3** (days 1 and 2 form the streak); resets to 0 when a scheduled habit is missed.
- **Multiplier limits (to design):** not permanent. It rises only up to a limit and then resets, and it also resets when a new habit is added. Designed so users clearly understand how to earn more mana and progress.
- **Steps and water** contribute to mana **(rules to confirm)**.
- **Fixed penalty** when a habit is deleted **(amount to confirm)**.
- Proposed: a spendable **balance** and a **lifetime earned** total that sets the level.
- **Profile:** mana and level. Level thresholds 1–150 **(to confirm)**.
- **Done when:** results match a table of worked examples you approve, and nothing is ever credited or penalised twice.

### Phase 7 — Ticket system

- Users spend mana on **tickets** that cover days of travel, or days when following habits isn't feasible. A ticket replaces a missed day: the streak continues and the multiplier is not reset.
- Buying is handled by the Mana engine; covering a day by the Habit tracker engine.
- Price, timing, limits and effect on the streak **(to confirm)**.

### Phase 8 — Habit reminders

- A notification when a habit's time window starts, and another when it ends ("mark it completed").
- An **end-of-day reminder**, on by default. Delivered as local notifications on the phone (proposed).

### Phase 9 — Image search engine and personal collection

- **Discover** tab, top section: take or upload a picture; the engine searches an online species database and returns a **card**.
- Species details are never fetched twice. Every search is kept in an **Images searched** collection.
- **Personal collection** (slide-out menu): identified subjects grouped by type, each photo with date and time. Photos stored as WebP at 1280 px; location rounded to about 500 m on the phone before upload, and removed from the image file.

### Phase 10 — Mana engine: pictures, learning, month-end bonus

- Pictures and things learned feed the Mana engine; a month-end bonus rewards image searches and learning **(definitions to confirm)**.

### Phase 11 — Daily challenges

- **One challenge a day** from season and location, on the Home card and in Discover.
- **Challenge page:** image or collage, common names by region in different languages, short English description, hollow **bookmark** that animates, fills and saves. Saved challenges are listed in **Profile**.
- Photographing the subject completes it and gives extra mana (amount later). Not completing it changes nothing.

### Phase 12 — Analytics engine and Analytics tab

- **Habits:** today as text; weekly and monthly **bar charts** (habits on X, times completed on Y), counted against scheduled days; number of deleted habits.
- **Images searched**, **steps and walks**, and **water**, each with its own analytics.

### Phase 13 — Private journal

- In the slide-out menu. Separate password and security questions; email verification to reset. Encryption approach **(to confirm)**.

### Phase 14 — Nature calendar

- Each day shows its nature moments: species found, photos, journal entries, completed challenges, long walks. Location in the app **(to confirm)**.

### Phase 15 — Special challenges

- Discover, bottom section: appear rarely, based on season or location, for trips; customisable dates; extra mana. Declining changes nothing.

### Phase 16 — Rewards

- Headline reward: a 12-month nature calendar from the user's own photos, as a printable PDF. More rewards per tier in Section 5.

---

## 4. Navigation at a glance

Details in [FRONTEND.md](FRONTEND.md) §9.

- **Tabs:** Home · Discover (image search, daily challenges, special challenges) · Analytics · Settings
- **Slide-out menu:** Journal · Personal collection · My Habits · theme switch and other settings shortcuts
- **Profile icon:** mana, level, saved challenges, tickets (proposed)

---

## 5. Levels, tiers and rewards

Levels run from 1 to 150. Tier names are preliminary.

| Levels | Title | Reward ideas (to confirm) |
| --- | --- | --- |
| 1–10 | The Observer | Species cards, basic analytics |
| 11–25 | The Wanderer | More saved-challenge slots, seasonal app theme, "first encounter" card finish |
| 26–40 | The Naturalist | Field-guide PDF of your collection, species range maps, rarer daily challenges |
| 41–60 | The Explorer | Special challenges appear more often, offline area packs, ambient nature sounds |
| 61–80 | The Steward | Printed nature calendar from your own photos, custom journal covers |
| 81–100 | The Guardian | "Year in the wild" recap, collection poster, optional real tree planting via a partner |
| 101–150 | The Deeply Connected | Lifetime field-journal book export, mentor badge, a personal milestone page per level |

The mana needed for each level is **not set yet**; we set it together with the Mana engine.

---

## 6. Engines at a glance

Details in [ARCHITECTURE.md](ARCHITECTURE.md) §4–6.

| Engine | Calculates | Feeds | Phase |
| --- | --- | --- | --- |
| Habit tracker | Today's habits, day close at 00:00, late amendments, ticket-covered days, counts | Mana, Analytics | 3, 7 |
| Step tracker | Step day close, goal met, walk trimming, distance, calories | Mana, Analytics, Steps tile | 4 |
| Water tracker | Water day close, goal met | Mana, Analytics, Water tile | 5 |
| Mana | Daily mana, streak multiplier, penalties, ticket purchases, corrections, bonuses, level | Profile | 6, 7, 10 |
| Image search | Identifies photos, builds cards, completes challenges | Mana, Analytics, collection | 9 |
| Analytics | Habit, image search, step and water analytics | Analytics tab | 12 |

---

## 7. Efficiency and data rules

Adopted 2026-11-23; details in ARCHITECTURE.md §6 and DB.md §10.

1. **Atomic grouped writes:** each engine saves all its results in one call and one transaction.
2. **Batches of users:** about 500 users per read and per write; about 1,600 calls instead of about 1.6 million to close 100,000 users' days.
3. **The database counts but never decides.**
4. **In-process first:** engines call the internal API inside the same process.
5. **Keep only what is used:** single ticks and glasses kept 30 days, walk blocks 7 days, engine markers 90 days, weekly analytics 90 days; no zero-mana rows; dormant users paused; photos as WebP. About 3 KB per active user per day long-term.

---

## 8. How each feature is delivered

Every phase runs these stages in order; a stage starts only when the previous one passes its exit check. Before stage 1, the phase's questions are answered and the rules are written into the docs.

1. **Frontend.** Screens on the design tokens, with typed mock data behind the same API client the real backend will use.
   - Exit: matches the agreed design on a small and a large phone, light and dark, with loading, empty and error states; meets FRONTEND.md performance budgets.
2. **Backend.** API endpoints and engine logic. Engines only calculate; the API only routes and calls the data layer; engine work is batched and saved atomically.
   - Exit: every write is idempotent, every error has a clear code, logs carry a request ID, layer-boundary lint passes.
3. **Database migrations.** One forward migration per change, following DB.md.
   - Exit: applies cleanly to a copy of staging data; batch reads checked with `EXPLAIN` on 100,000 seeded users; rollback note written.
4. **Rigorous testing.** Engine rules against tables of worked examples, API tests, data-layer tests on a real Postgres, one end-to-end flow per feature on iOS and Android, including offline and late-sync cases.
   - Exit: all suites green in CI, the feature's "Done when" passes, no open crash on staging.
5. **Update and deployment.** Staging migration → internal test build → your sign-off → production migration → EAS Update (JS-only) or a store build (native change).
   - Exit: production smoke test passes, release notes written, checklist ticked.

**After every stage (rule set 2026-11-24):**

- Update this checklist for all affected phases.
- Update FRONTEND.md, ARCHITECTURE.md and DB.md so they match what was actually built.
- Add or update the entry in IMPROVEMENTS_LOG.md: Part, Phase, what was in plan, what was done, required changes, comparison table. Log every instruction you give.

**Frontend exit check also requires:** 120 fps on a production build on a 120 Hz phone, measured with the Perf Monitor or Instruments (FRONTEND.md §7.3).

---

## 9. Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Midnight pipeline fails or runs twice | Days not closed, or mana credited twice | Atomic batch writes; unique engine-run keys; failed batches split and retried per user |
| Large time zone hits midnight at once | Database overload | Batches of 500, limited parallelism, 15-minute target window; load test before launch |
| Concurrent mana writes | A penalty, ticket purchase and the midnight run overwrite each other | Version check on `mana_state` |
| Offline ticks and late step syncs | Data arrives after the day closed | Phone timestamps with clock correction; late data amends the day and mana is replayed (7-day window) |
| Phone clock wrong or changed | Ticks land on the wrong day | Server compares the phone clock with its own at each send and corrects the timestamps |
| Travel across time zones or the date line | Days shorter, longer or skipped | Day follows the phone's current zone; users plan date-line travel themselves, e.g. with a ticket (details later) |
| "Habits are ultimate" feels harsh | Users leave after a broken streak | Tickets for valid reasons; calm wording; penalty shown before deleting |
| Image identification is wrong or unsure | Wrong cards, unfair challenge results | Show top candidates with confidence; let the user confirm |
| Sparse local species data | Repetitive challenges | Widen the area, then fall back to common seasonal species |
| Notification and health permissions | Reminders or steps unavailable | Ask at the right moment; request only step-count read access |
| Photo location exposure | Privacy harm | Location removed from image files; stored rounded to about 500 m |
| Layer rules drift | Logic in SQL, engines touching the DB | Separate packages, CI lint rules, query review rule |
| Missing 120 fps | Breaks the non-negotiable smoothness rule | Native press feedback, UI-thread animation only, iOS 120 Hz key, Android refresh-rate request, production-build frame check at every frontend stage |
| Judging speed in development mode | Wrong conclusions about smoothness | Use `npm run mobile:perf` or a production build; never Expo Go development mode |

---

## 10. Next step

Answer the open questions in FRONTEND.md §13, ARCHITECTURE.md §11 and DB.md §11. When you give the command, Phase 0 starts.
