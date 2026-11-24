# Wildself — Improvements Log

_As of 2026-11-24_

Every build stage of every phase gets an entry here: what was planned, what was actually built, what you asked to change afterwards, and a side-by-side comparison. Every instruction you give is also logged, with the doc it changed.

**Related docs:** [POA.md](POA.md) (plan and progress) · [FRONTEND.md](FRONTEND.md) (app) · [ARCHITECTURE.md](ARCHITECTURE.md) (backend) · [DB.md](DB.md) (database)

**How entries are kept**

- One entry per build stage: **Part** (Frontend, Backend or DB) and **Phase**.
- **2. What was done** records the original implementation and is never rewritten. Later changes go in **3. Required changes**, and the **comparison table** shows plan, original and changed versions side by side.
- An entry is updated after every review, and the POA checklist and all other docs are updated with it.

---

## Phase entries

### Frontend — Phase 0: Foundations

_Built 2026-11-23 · Reviewed on your phone 2026-11-24 · Changes made 2026-11-24 · Re-tested by you 2026-11-24: much smoother · Status: waiting for the 120 fps check on a production build_

#### 1. What was in plan

From POA.md Phase 0 and FRONTEND.md:

- Expo app in a monorepo, design tokens (colour, type, spacing, radius, motion), base components.
- Tab shell: Home, Discover, Analytics, Settings. Slide-out menu shell: Journal, Personal collection, My Habits, theme switch.
- Offline action queue on the phone, stored in MMKV.
- Performance tools: FlashList, expo-image with ThumbHash, Metro `inlineRequires`, Reanimated skeletons and worklets, `LayoutAnimation`, `Animated` with the native driver, shared element transitions, Rive or Lottie.
- Frame rate budget (proposed): 60 fps on a mid-range Android phone, 120 fps on ProMotion iPhones.
- Exit check: matches the design on a small and a large phone, light and dark, with loading, empty and error states.

#### 2. What was done (original implementation, 2026-11-23)

- **Project:** npm-workspaces monorepo; `apps/mobile` on Expo SDK 58 (React Native 0.88.1, React 19.3, TypeScript 6), Expo Router.
- **Design:** tokens for light and dark ("Dusk"), DM Sans + Literata (only the 6 weights used: 1.1 MB instead of 5.1 MB), Feather icons.
- **Components:** text, button, card, loading block, empty state, crash screen, top bar, back header, floating tab bar with a gliding indicator, segmented theme switch, slide-out menu, design preview page.
- **Navigation:** stack → slide-out menu → four tabs; Profile, Journal, Personal collection and My Habits as placeholder pages.
- **Motion:**
  - press: Reanimated spring (shrink to 0.97 and one tone deeper), started from React Native's `Pressable` touch events, which arrive through JavaScript
  - tab and theme indicators: started after React re-rendered the new selection
  - tab change: cross-fade with 8 pt drift (native driver); menu: page drifts 24 pt (Reanimated)
  - Reduce Motion respected everywhere
- **Storage:** expo-sqlite key-value store instead of MMKV, so the app runs in Expo Go.
- **Performance settings:** `inlineRequires` on, React Compiler on, splash held until fonts load.
- **Checks:** typecheck, lint, expo-doctor 20/20, 45 unit tests, Android and iOS bundles build.
- **Not used yet**, because no Phase 0 screen needs them: FlashList, expo-image, `LayoutAnimation`, shared element transitions, Rive or Lottie.

#### 3. Required changes

From your review on 2026-11-24:

1. **Design:** meets your expectations. No change.
2. **120 fps is non-negotiable.** The app did not feel like 120 fps. Changes made:
   - **Press feedback moved to native code.** `PressableScale` now uses Gesture Handler's native `Touchable`. The platform recognises the touch and animates the shrink and tone itself, so feedback no longer waits for JavaScript. Every button, tab, menu item and switch uses it.
   - **Indicators start on the tap.** The tab bar and theme switch highlights begin gliding the moment you tap, instead of after React re-renders.
   - **iOS 120 Hz unlocked.** Added `CADisableMinimumFrameDurationOnPhone` to the iOS settings. Without it, iOS caps every app at 60 fps on ProMotion iPhones.
   - **Testing in production mode.** Added `npm run mobile:perf`. The normal development mode runs extra checks that slow everything down, so it can't show the real frame rate.
   - **Test setup** adjusted for the native component, including a Windows-specific path issue in Jest.
3. **Still open before this stage can be ticked:**
   - Android: ask the phone for its highest refresh rate. This needs a small native setting and a development build (Phase 0 deployment stage).
   - Verify 120 fps on a production build of our own app on a 120 Hz phone. Expo Go can't prove it: on iPhone it uses Expo Go's own frame-rate setting, not ours. This needs an Expo account for EAS builds, and your phone model.

#### 4. Comparison table

| Aspect | In plan | Original implementation (2026-11-23) | After changes (2026-11-24) | Status |
| --- | --- | --- | --- | --- |
| Look and layout | Mockup + sketch, light and dark | Built as planned | Unchanged | ✅ Approved by you |
| Press feedback | Shrink 0.97 + one tone deeper | Reanimated spring, started from a JavaScript touch event | Native `Touchable`: platform-run, 80 ms in, 220 ms out | ✅ Done, to verify on device |
| Press response time | Next frame | Waited for the JavaScript thread | Next frame, without JavaScript | ✅ Done, to verify on device |
| Tab and theme indicators | Glide on a spring | Started after React re-rendered | Start on the tap | ✅ Done |
| Tab transition | Cross-fade + 8 pt drift | Native driver (UI thread) | Unchanged (already native) | ✅ |
| Menu drift | 24 pt drift | Reanimated (UI thread) | Unchanged | ✅ |
| iOS frame rate | 120 fps on ProMotion | Capped at 60 fps by iOS (key missing) | `CADisableMinimumFrameDurationOnPhone` set | ✅ Set, active in our own builds |
| Android frame rate | 60 fps on mid-range phones | Platform default | Request highest refresh rate | ⏳ Planned for the development build |
| Frame-rate target | 60 fps Android / 120 fps iPhone (proposed) | Same | **120 fps on every 120 Hz phone, non-negotiable** | 🔁 Changed by you |
| Performance testing | Flashlight, profiler | Development mode in Expo Go | `npm run mobile:perf`; final check on a production build | ✅ You re-tested: much smoother. ⏳ Production-build check pending |
| On-device storage | MMKV | expo-sqlite key-value store | Unchanged | 🔁 Changed during build (runs in Expo Go) |
| Fonts | DM Sans + Literata | 6 weights, 1.1 MB | Unchanged | ✅ |
| Checks | Typecheck, lint, tests | All passing (45 tests) | All passing (45 tests), bundles build | ✅ |

### Backend — Phase 0: Foundations

_Built 2026-11-24 · Status: built and tested; waiting for the layer-boundary lint (testing stage) and a run against your local database_

#### 1. What was in plan

From POA.md Phase 0 and ARCHITECTURE.md:

- One build with `api` and `worker` roles; internal API interface; scheduler skeleton; auth wiring.
- Stack (approved 2026-11-24): Node.js 22 + TypeScript, Fastify, Zod, always-on container, managed PostgreSQL; auth decided before Phase 1.
- Rules: strict layers (§2), efficiency rules (§6), no silent failures, security first (§3.6).

#### 2. What was done (original implementation, 2026-11-24)

- **Layout:**
  - `services/backend`: one package; `--role=api` or `--role=worker` picks the role at start-up.
  - `packages/contracts`: error codes and response shapes.
  - `packages/internal-api`: the typed interface the worker and engines call.
- **Configuration:** every setting is validated at start-up, and the server refuses to start if:
  - the database URL is missing or not PostgreSQL
  - production uses the development login
  - production uses an unencrypted database connection
  - production has no error reporting

  Error messages name the setting, never its value.
- **API (Fastify 5):**
  - `GET /health` and `GET /health/ready` are public; `GET /v1/session` proves the login chain.
  - Every other route, including unknown ones, needs login, so routes can't be discovered.
  - A request id on every response; an incoming id is reused only if it's a valid UUID, so it can't inject text into the logs.
  - Security headers (helmet); 256 KB body limit; rate limit per user, or per IP when not logged in.
  - Timeouts on requests and connections.
  - One error format, `{ error: { code, message, requestId } }`; unexpected errors show no internal details.
- **Login:** an `Authenticator` interface. `deny-all` is the default; `dev-stub` accepts `Bearer dev:<uuid>`, for local work only, and is refused in production twice: by config and in code.
- **Worker:**
  - A scheduler that fires on minute boundaries without drifting, never overlaps a job with itself, and reports every failure and overrun.
  - Exactly one leader, via a PostgreSQL session lock checked before every tick. If the lock is lost, the worker steps down and retries.
  - A heartbeat job every minute, with Sentry Crons check-ins.
- **Observability:**
  - Structured logs (pino) with tokens, cookies and secrets redacted.
  - Sentry 11 with **all personal-data collection switched off**. Sentry 11 collects user info, cookies, headers, request bodies, query strings, database values and local variables by default.
  - Fatal errors are logged and reported, then the process exits so the host restarts it.
- **Build:** esbuild bundles our code into one 21 KB file; third-party packages stay normal dependencies.
- **Checks:**
  - Typecheck passes; 35 backend tests and 2 internal API tests pass. They cover security, config, auth and the scheduler.
  - The built server was started and called: `/health` 200 with security headers; `/health/ready` 503 with the real cause logged and hidden from the caller; `/v1/session` 401.
  - Dependency audit: no backend runtime package affected. Two moderate issues exist only in Jest and Expo tooling; not force-fixed, because the fix breaks Expo.

#### 3. Required changes

None from you yet. Known follow-ups:

1. Graceful shutdown on a stop signal could not be exercised on Windows; it is verified on Linux in the deployment stage.
2. Layer-boundary lint (engines cannot import the data layer) is part of the testing stage.

#### 4. Comparison table

| Aspect | In plan | Original implementation (2026-11-24) | After changes | Status |
| --- | --- | --- | --- | --- |
| Roles | `services/api` and `services/worker` folders | One package `services/backend`, role chosen at start-up | — | 🔁 Simplified during build (same "one build, two roles" rule) |
| Framework | Fastify | Fastify 5.12 | — | ✅ |
| Hosting | Always-on container | Dockerless so far; build is one file ready for a container | — | ⏳ Container and host at deployment |
| Auth | Interface until Phase 1 | `deny-all` default, `dev-stub` local only | — | ✅ |
| Error reporting | Sentry | Sentry 11, personal data off, Crons heartbeat | — | ✅ (privacy defaults found and fixed during build) |
| Single worker | One active copy | PostgreSQL advisory lock, verified each tick | — | ✅ (DB test pending) |
| Request validation library | Zod type provider | Zod for config only; route validation added with the first request bodies | — | 🔁 Fewer dependencies in Phase 0 |
| Security rules §3.6 | All | Headers, limits, auth by default, safe errors, redaction, fail-fast config | — | ✅ |
| Tests | Unit tests | 37 passing | — | ✅ |

### DB — Phase 0: Foundations

_Built 2026-11-24 · Status: local environment done (integration tests pass, first migration ran on `wildself_dev`); staging and production at deployment_

#### 1. What was in plan

From POA.md Phase 0 and DB.md: PostgreSQL environments (local, staging, production), migration tool, data-layer skeleton, monthly partition creation, CI check against logic in the database.

#### 2. What was done (original implementation, 2026-11-24)

- **`packages/data`:** connection pool on postgres.js 4, with:
  - UTC on every connection
  - a server-side statement timeout plus a client-side query timeout
  - TLS required in production
  - a health ping
  - the worker leader lock (`pg_try_advisory_lock` on a dedicated connection, freed automatically if the process dies)
- **Migrations:**
  - `node-pg-migrate` 9 with plain SQL files in `db/migrations`, run through `npm run db:migrate`.
  - The wrapper runs the no-logic check first, refuses `down`, checks order and uses the migration lock.
  - No migration files yet: Phase 0 needs no tables.
- **No-logic check** (`npm run db:check`): rejects functions, procedures, triggers, rules, `DO` blocks, procedural languages, `pg_cron` and generated columns, and ignores comments. 12 tests pass.
- **Local setup guide:** `db/local-setup.md` creates a non-superuser `wildself_app` and the `wildself_dev` and `wildself_test` databases. The password only ever goes into the git-ignored `.env`.
- **Integration tests (6):**
  - connection, UTC, query timeout
  - only one holder of the lock at a time; lock freed on disconnect; a released lock can't be verified again
  - refuse to run on a database without "test" in its name; skip with a printed warning if no test database is set

#### 3. Required changes

1. Your local PostgreSQL service was stopped. Starting it and creating the user and databases needs you (administrator rights and your `postgres` password); see `db/local-setup.md`. **Done by you, 2026-11-24.**
2. **First run on your database (2026-11-24): 3 of 6 integration tests failed, all because of mistakes in the tests, not the data layer.** Fixed in `packages/data/test/database.integration.test.ts`:
   - **UTC test:** `show timezone` returns a column named `TimeZone`, but the test read `tz`. It now reads `current_setting('TimeZone') as tz`. The connection was on UTC all along.
   - **Lock freed on crash:** the test faked a crash with a polite close, which waits up to 5 s for the locked connection and ran past the test's time limit. It now has the server kill the connection (`pg_terminate_backend`), which is what a real crash looks like. It also checks something new: the old holder's `verify()` fails, so a worker that loses its lock stops running jobs.
   - **Released lock:** failed only because the timed-out test still held the lock. Passes unchanged.
   - Checked at the same time: the real worker releases its lock before closing at shutdown, so the polite-close delay never affects it.
3. **`.env` finding:** `DATABASE_URL` and `TEST_DATABASE_URL` each appear twice. The template lines (8 and 10, `CHANGE_ME`) are ignored because the last copy wins. The `DATABASE_URL` on line 21 has a different password from the working one on line 22, so the first migration on `wildself_dev` is refused until you fix it. The migration tool, API and worker were checked against `wildself_test` instead. **Fixed by you the same day; the first migration then ran on `wildself_dev`.** The two ignored template lines are still in the file (harmless).
4. Monthly partition creation moves to Phase 3, where the first partitioned table appears.
5. Staging and production databases are created in the deployment stage.

#### 4. Comparison table

| Aspect | In plan | Original implementation (2026-11-24) | After changes | Status |
| --- | --- | --- | --- | --- |
| Environments | Local, staging, production | Local guide ready; staging and production at deployment | Local set up by you and working; staging and production at deployment | ✅ Local · ⏳ Staging, production |
| Migration tool | node-pg-migrate or dbmate | node-pg-migrate 9, SQL files, forward-only wrapper | — | ✅ |
| No-logic CI check | Functions, procedures, triggers, rules, pg_cron | Also `DO` blocks, procedural languages, generated columns | — | ✅ Stricter than planned |
| Data layer | Skeleton | Pool with timeouts and UTC, ping, leader lock | — | ✅ |
| Partition creation | Phase 0 | Moved to Phase 3 (first partitioned table) | — | 🔁 Moved |
| Integration tests | On a real PostgreSQL | 6 written, skip loudly without a test database | 3 test mistakes fixed; crash test now kills the connection and checks the holder notices; 6/6 pass, 4 runs in a row | ✅ |
| First migration run | — | Not run (no database) | Tool verified on `wildself_test`, then ran on `wildself_dev` after your `.env` fix | ✅ |

---

## Instructions log

Everything you have asked for, newest first, with where it was applied.

| Date | Instruction | Applied in |
| --- | --- | --- |
| 2026-11-24 | `.env` password fixed | First migration ran on `wildself_dev`; POA.md, DB Phase 0 entry |
| 2026-11-24 | Local database setup done; check it | Integration tests run and fixed; API, worker and migration verified; `.env` finding reported (DB Phase 0 entry; POA.md) |
| 2026-11-24 | Start building Phase 0 backend and database | `services/backend`, `packages/*`, `db/`; entries above |
| 2026-11-24 | Push all existing code to `github.com/chvsaditya-wq/Wildself` before developing | First commit `3a549c5` pushed to `main` |
| 2026-11-24 | Approve the stack; batched sync must not cause security issues; keep security a priority throughout | ARCHITECTURE.md §3.5, §3.6, §8.1; POA.md principle 10; memory |
| 2026-11-24 | Choose the stack with the lowest running cost and best efficiency: fast, cheap, easy, no silent failures, few API calls; take no action until decided | ARCHITECTURE.md §8.1 (always-on Fastify, managed PostgreSQL, not serverless) |
| 2026-11-24 | Login: decide later. Repository: create now on GitHub (private) | ARCHITECTURE.md §8.1, §11.7 |
| 2026-11-24 | Re-tested with `mobile:perf`: much smoother | Frontend Phase 0 entry; POA.md; FRONTEND.md status |
| 2026-11-24 | 120 fps is non-negotiable; make the app super smooth | Code (press feedback, indicators, iOS setting, perf script); FRONTEND.md §1, §6.4, §7; this log |
| 2026-11-24 | UI design meets expectations | FRONTEND.md status; this log |
| 2026-11-24 | Create this improvements log in the Part / Phase / plan / done / changes / comparison format; log every instruction | This document; POA.md §8 |
| 2026-11-24 | Update the checklist for all phases and all documents after each building phase | POA.md §8; all doc status lines; memory |
| 2026-11-23 | Start Phase 0, following the Frontend → Backend → DB → Testing → Deployment iterations | `apps/mobile`; POA.md checklist |
| 2026-11-23 | Multiplier starts on day 3; round photo locations on the phone; date line planned by users (details later); tickets keep the streak and multiplier; multiplier is capped and resets, including when a habit is added (to design) | ARCHITECTURE.md §2, §4.4, §11; DB.md §11; POA.md Phases 6–7 |
| 2026-11-23 | All data cuts; streak needs 2 days; missed days are missed, never skipped; walk button on the Steps tile; `now()` only for bookkeeping; cascade deletes; count only for deleted habits; phone's current time zone; locations to 500 m; keep only relevant data; ticket system | DB.md; ARCHITECTURE.md §3–5, §4.8; POA.md Phase 7 |
| 2026-11-23 | Steps option C (all-day + walks); forgotten walk ends after 20 min, 4 h max; no GPS; 7-day late-data window; tell the user when a late sync restores progress | ARCHITECTURE.md §3.4, §4.2; DB.md §5 |
| 2026-11-23 | Offline ticks count by the phone's time; the phone sends steps the same day; start/stop step counter idea | ARCHITECTURE.md §3.4; DB.md §4 |
| 2026-11-23 | Adopt all four efficiency rules (atomic writes, batches, count-not-decide, in-process) | ARCHITECTURE.md §6; DB.md §1, §8 |
| 2026-11-23 | Add Step tracker and Water tracker engines; fixed penalty for deleting a habit; plan Mana with steps and water | ARCHITECTURE.md §4; POA.md phase order |
| 2026-11-23 | Habit tracker engine: schedules (all days, except Sunday, custom), immediate delete, mana pairing, weekly and monthly bar charts, mana at 00:00, show habits only on their days, time windows with reminders, end-of-day reminder | ARCHITECTURE.md §4.1; DB.md §4; POA.md Phases 2–3, 8 |
| 2026-11-23 | Home and challenge answers (H1–H10): one daily challenge and its page, bookmark, saved challenges in Profile, undo until 23:59, completed habits stay and fade, tap name to complete, edit or delete only in My Habits, Steps / Water tiles as words first, tap Water to add a glass, scrollbar only while scrolling, rules between habit rows, rename Image search to Discover | FRONTEND.md §9, §13 |
| 2026-11-23 | Tabs Home / Image search / Analytics / Settings; slide-out menu contents; habits scroll box; greeting placement; mana and level in Profile; Steps and Water tiles always shown | FRONTEND.md §9 |
| 2026-11-23 | Hand sketch of the Home screen | FRONTEND.md §9.2 |
| 2026-11-23 | Separate docs: POA for plan and progress, ARCHITECTURE for backend, plus database and frontend docs; frontend ground rules (smoothness, performance tools, design reference, never-use list) | FRONTEND.md, DB.md |
| 2026-11-20 | Architecture: engines separate from CRUD, 4 layers, API as the only path, database CRUD only; Mana, Analytics and Image search engines; water tracker idea; ask before writing any behaviour | ARCHITECTURE.md; memory |
| 2026-11-20 | POA as a markdown file with a checklist of phases; start development only on command | POA.md; memory |
| 2026-11-20 | Plan of action, one feature at a time: Frontend → Backend → DB migrations → Testing → Deployment | POA.md |
