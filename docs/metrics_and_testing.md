# Wildself — Metrics and Testing

_As of 2026-11-24 · Phase 0 testing stage done: CI, layer lint, k6 baseline, security fix_

This is the standard of reference for keeping the app fast, stable and secure. It is also the working notebook: every test run, every measured number and every improvement idea is written down here, compared with its target, and acted on.

**Related docs:** [POA.md](POA.md) (plan and progress) · [ARCHITECTURE.md](ARCHITECTURE.md) (backend) · [DB.md](DB.md) (database) · [FRONTEND.md](FRONTEND.md) (app) · [IMPROVEMENTS_LOG.md](IMPROVEMENTS_LOG.md) (changes and instructions) · [reports/](reports/) (stage reports)

**How targets are labelled**

| Label | Meaning |
| --- | --- |
| **Decided** | You set or approved it. Changing it needs your approval |
| **Built** | Already enforced in code; the value is a default we chose while building. Confirm or change it when convenient |
| **Proposed** | My recommendation, not yet approved. It guides testing but is confirmed with you before the phase it matters for |

If a target here disagrees with a detailed doc, the detailed doc wins, and this file is corrected.

---

## 1. How this document is used

At every stage of every phase (Frontend → Backend → Database → Testing → Deployment):

1. **Before building:** read the metrics in §3 that the phase touches and note the targets.
2. **After building:** run the tests in §2 that fit the stack and module. Record every run in the test log (§9), passing or failing.
3. **Compare** each result with its target. A miss becomes an item in the improvement backlog (§10), with the fix and the date it was fixed.
4. **Write the stage report** in [reports/](reports/) (§11).
5. **Update this file:** new metrics, new measurements, changed targets, and closed or new backlog items.
6. **Push to GitHub only after you have reviewed the report and confirmed.**

---

## 2. Testing strategy by module

### 2.1 What is tested, with which tool

| Module | Test types | Tool | When |
| --- | --- | --- | --- |
| **Mobile app** (`apps/mobile`) | Unit and component tests | Jest + React Native Testing Library | Every frontend stage; CI on every push |
| | Keyboard avoidance on every screen and sheet with a text field | Unit tests (settings in place), on-phone check on iOS and Android, Maestro (type in each field, confirm it and the submit button stay visible) | Every frontend stage (FRONTEND.md §7.4) |
| | Render-count regressions | Reassure | From the first list-heavy screen (Phase 3) |
| | End-to-end flows, including offline and late sync | Maestro (iOS and Android) | Testing stage of every feature phase |
| | Frame rate and smoothness | Perf Monitor, Xcode Instruments, Flashlight | Every frontend stage, on a production build |
| | Cold start, bundle size, app size | Production build + timing, `expo export` size report | Every deployment stage |
| **Engines** (calculation only) | Rule tests against tables of worked examples; edge cases (time zones, midnight, late data) | Vitest; property-based tests (fast-check) for streak and mana maths | Backend stage of every engine phase |
| **API** (`services/backend`) | Route tests without a network | Vitest + Fastify `inject` | Every backend stage |
| | Security tests per endpoint: no login, another user's data, malformed input, oversized body, rate limit | Vitest + Fastify `inject` | Testing stage of every phase (ARCHITECTURE.md §3.6) |
| | Contract tests: responses match the OpenAPI contract | Vitest + schema check | From Phase 1 |
| | Load tests (§2.2) | **k6** | Testing stage of every phase that adds or changes endpoints; before launch |
| **Data layer** (`packages/data`) | Integration tests on a real PostgreSQL | Vitest (`npx vitest run --root packages/data`) | Every database stage |
| | Query plans on 100,000 seeded users | `EXPLAIN (ANALYZE, BUFFERS)` | Database stage of every phase with batch reads (DB.md §9) |
| **Migrations** (`db/`) | No logic in the database | `npm run db:check` | Every migration; CI |
| | Applies cleanly to an empty database and to a copy of staging | `npm run db:migrate` | Database stage; deployment stage |
| **Worker** | Scheduler, leadership, job failures | Vitest | Every backend stage |
| | Midnight pipeline at scale (100,000 users in one time zone) | Seeded database + timing script | Phase 3 onward; before launch (ARCHITECTURE.md §10) |
| **Security and supply chain** | Known vulnerabilities in dependencies | `npm audit` | CI on every push |
| | Secrets committed by mistake | Secret scanner (gitleaks) | CI on every push |
| | Response headers and common web flaws on staging | OWASP ZAP baseline scan | Deployment stage |
| **Deployment** | Smoke test after every deploy: health, readiness, login required | Script / k6 smoke | Every deployment stage |

### 2.2 Load testing with k6

k6 runs scripted virtual users against the API and fails the run if any threshold is missed. Scripts will live in `tests/load/`, one per scenario. Runs go against local and staging only, **never production**.

| Scenario | Shape | Answers |
| --- | --- | --- |
| **Smoke** | 1–2 virtual users, 1 minute | Do the script and the endpoints work at all? |
| **Average load** | Expected traffic (§5), 10 minutes | Are the targets met on a normal day? |
| **Peak** | Expected peak-hour traffic, 10 minutes | Are they met at the busiest hour? |
| **Stress** | 2–3× peak, 10 minutes | Where does it degrade, and does it recover cleanly? |
| **Spike** | 0 → 10× peak in 30 seconds | Do limits and errors behave, with no crash? |
| **Soak** | Average load for 1–2 hours | Memory leaks, connection leaks, slow drift |
| **Breakpoint** | Ramp until targets fail | Real capacity of one instance (feeds §7) |
| **Rate-limit check** | One client above the limit | 429 at exactly the configured limit, with the standard error format |

**Default k6 thresholds (Proposed):** failed requests < 0.1% (excluding intended 429s), `p(95)` duration ≤ 200 ms for reads and ≤ 300 ms for writes, checks passing > 99.9%.

**Scripts (`tests/load/`):**

| Script | Scenario |
| --- | --- |
| `smoke.js` | Smoke |
| `steady.js` | Average load, peak, fixed rates |
| `breakpoint.js` | Breakpoint |
| `rate-limit.js` | Rate-limit check |

`smoke.js` and `rate-limit.js` run in CI on every push; the others run locally and on staging.

**How to run locally:**

1. Build the server: `npm run build --workspace services/backend`.
2. Start it against the **test** database with `NODE_ENV=test`, `AUTH_MODE=dev-stub` and `DATABASE_SSL=disable`. Add `RATE_LIMIT_PER_MINUTE=10000` for every script except the rate-limit check.
3. Run, for example, `k6 run -e BASE_URL=http://127.0.0.1:3000 tests/load/smoke.js`.

**Phase 0 results:** see §5 and the test log (§9).

---

## 3. Metric reference

Every metric to watch, grouped by category. "From" is the phase where it starts to matter.

### 3.1 Client app performance

| Metric | Why it matters | Target | Label | Measured with | From |
| --- | --- | --- | --- | --- | --- |
| Frame rate | Smoothness rule | **120 fps** on every 120 Hz screen; the screen's maximum on 60/90 Hz | Decided | Perf Monitor, Instruments | 0 |
| Dropped UI-thread frames in transitions | Visible stutter | 0 | Decided (FRONTEND.md §7.3) | Profiler | 0 |
| Press and tick feedback | Feels instant | Next frame (8.3 ms at 120 Hz), haptic in the same tap | Decided | Instruments, slow-motion video | 0 |
| Cold start to interactive Today | First impression | ≤ 1.5 s iPhone 13; ≤ 2.5 s reference Android | Decided (FRONTEND.md §7.3) | Production build timing | 3 |
| Flashlight score on key flows | Android performance overall | ≥ 90 | Decided (FRONTEND.md §7.3) | Flashlight | 3 |
| Long list scrolling (500 species cards) | Collection screen | No blank cells on fast scroll | Decided | Manual + Flashlight | 9 |
| JS bundle size | Start-up time, update size | Tracked every release; no growth > 10% without a reason. **Baseline 2026-11-24: 4.3 MB** (Hermes bytecode, Android and iOS) | Proposed | `expo export` | 0 |
| Keyboard never covers the focused field or its submit button | Non-negotiable keyboard rule | 100% of screens and sheets with text fields, iOS and Android | Decided (FRONTEND.md §7.4) | Unit tests + on-phone check per screen; Maestro from Phase 1 | 0 |
| Gap between focused field and keyboard | Comfortable typing | 24 pt (`KEYBOARD_GAP`) | Built | Screenshot on device | 0 |
| Keyboard animation | Smoothness rule | Content moves with the keyboard frame by frame; 0 dropped frames | Decided (120 fps rule) | Perf Monitor / Instruments on a production build | 0 |
| First field focus to keyboard shown | Feels instant | ≤ 1 frame of extra delay (keyboard preloaded on iOS) | Proposed | Slow-motion video | 1 |
| Font assets | Start-up time | 1.1 MB (6 weights) | Built | File size | 0 |
| Memory use on long sessions | Crashes on older phones | No steady growth over a 30-minute session | Proposed | Xcode / Android Studio profiler | 3 |
| Crash-free sessions | Stability | ≥ 99.8% | Proposed | Sentry (mobile) | 17 |
| Offline queue depth on the phone | Sync health | Drains to 0 within 1 minute of coming online | Proposed | App telemetry (no personal data) | 3 |

### 3.2 Network and API traffic

| Metric | Why it matters | Target | Label | Measured with | From |
| --- | --- | --- | --- | --- | --- |
| API latency, reads | Feels fast | p95 ≤ 200 ms, p99 ≤ 500 ms (server time) | Proposed | k6, server logs | 1 |
| API latency, writes | Ticks and saves | p95 ≤ 300 ms, p99 ≤ 800 ms | Proposed | k6, server logs | 2 |
| `POST /sync` latency (100 actions) | Catch-up after offline | p95 ≤ 1 s | Proposed | k6 | 3 |
| Readiness check latency | Load balancer health | p95 ≤ 50 ms | Proposed | k6 | 0 |
| 5xx error rate | Server faults | < 0.1% of requests | Proposed | Logs, Sentry | 0 |
| 4xx rate by code | Client bugs or abuse | Watched for spikes; no target | — | Logs | 1 |
| Request body size | Abuse, mobile data | ≤ 256 KB (rejected above) | Decided (ARCHITECTURE.md §3.5) | Enforced; logs | 0 |
| Response size | Mobile data, speed | p95 ≤ 20 KB for JSON; compressed above 1 KB | Proposed | k6 | 1 |
| Mobile data per user per day (no photos) | Users on limited plans | ≤ 1 MB | Proposed | Estimate from §4 + measurement | 3 |
| Photo upload size | Speed, storage cost | ~400 KB (WebP, 1280 px, location removed) | Decided (DB.md, `sightings`) | Upload logs | 9 |
| Requests per active user per day | Capacity planning | ~30 (estimate, §5) | Proposed | Logs | 3 |
| HTTPS only | Privacy | 100% in staging and production | Decided (ARCHITECTURE.md §3.6) | Host config, ZAP | Deploy |

### 3.3 Server (API process)

| Metric | Why it matters | Target | Label | Measured with | From |
| --- | --- | --- | --- | --- | --- |
| CPU use | Headroom | < 70% sustained over 5 minutes | Proposed | Host metrics | Deploy |
| Memory use | Crashes, leaks | < 75% of the container limit; flat in soak tests | Proposed | Host metrics, k6 soak | Deploy |
| Event-loop delay (Node.js) | One slow task stalls every request | p99 ≤ 50 ms | Proposed | `perf_hooks` monitor in the server | 1 |
| Unexpected restarts | Crashes | 0 per week | Proposed | Host, Sentry | Deploy |
| Request timeout | Stuck requests | 30 s | Built | `app.ts` | 0 |
| Connection timeout | Slow clients | 10 s | Built | `app.ts` | 0 |
| Graceful shutdown | No dropped requests on deploy | In-flight requests finish; forced exit after 15 s | Built (to verify on Linux) | Deploy test | Deploy |
| Start-up time | Fast deploys and recovery | ≤ 3 s to ready | Proposed | Deploy logs | Deploy |
| Server bundle size | Deploy speed | 21 KB (our code) | Built | `npm run build` | 0 |

### 3.4 Load balancing and scaling

| Metric / policy | Why it matters | Target / policy | Label | From |
| --- | --- | --- | --- | --- |
| Health check used by the load balancer | Traffic only to healthy copies | `GET /health/ready`, every 10 s, out after 3 failures | Proposed | Deploy |
| Liveness check (restart if dead) | Recover hung processes | `GET /health` | Built | Deploy |
| API copies | Availability | 1 in staging; **2 in production** so a deploy or crash never takes the API down | Proposed | Deploy |
| Distribution | Even load | Host default (round-robin or least-connections); **no sticky sessions**: the API keeps no state between requests | Proposed | Deploy |
| Scale out | Handle growth | Add an API copy when CPU > 70% for 10 minutes or read p95 > 200 ms | Proposed | 17 |
| Scale in | Cost | Remove a copy when CPU < 30% for 30 minutes, never below the minimum | Proposed | 17 |
| Deploy strategy | No downtime | Rolling: a new copy passes readiness before an old one drains | Proposed | Deploy |
| Worker copies | Midnight run exactly once | Exactly one active, via the PostgreSQL leader lock; a standby may wait | Decided (ARCHITECTURE.md §6.4) | 0 |
| Worker scaling | More users at midnight | Never more workers; raise batch parallelism instead (§3.8) | Decided | 3 |
| Database connections budget | Avoid "too many connections" | (API copies × 10) + worker 10 + 5 for migrations ≤ 80% of the database's maximum | Proposed | Deploy |
| Rate limit across copies | Limits must stay correct with 2+ copies | Shared limit store before running 2 copies (see §10) | Proposed | Deploy |

### 3.5 Rate limits and abuse protection

| Limit | Applies to | Value | Label | From |
| --- | --- | --- | --- | --- |
| General request rate | Every route, per user (or per IP before login) | 120 requests per minute → 429 `RATE_LIMITED` | Built; exact limit verified with k6 | 0 |
| Callers without a login | Every protected route and unknown routes | Counted by IP **before** the login check, so token guessing and route probing are limited | Built (security fix from Phase 0 testing) | 0 |
| Health checks | `/health`, `/health/ready` | Share the per-IP allowance. Behind a host proxy, `TRUST_PROXY` must be on, or every user would share the proxy's IP | Built | Deploy |
| Supabase sign-in requests | Sign-up, sign-in, code requests | 30 per 5 minutes per IP; one code per user per 60 s; token grants 150 per 5 minutes per IP | Supabase defaults (AUTH.md Step 10) | 1 |
| Supabase emails | Codes and confirmations | Built-in: team addresses only, ~2 per hour. Custom SMTP: starts at 30 per hour, raise as needed | Supabase (AUTH.md Step 4) | 1 |
| Request body | Every route | 256 KB → 413 | Decided | 0 |
| Sync batch | `POST /sync` | ≤ 100 actions and 256 KB per request; bigger queues are split by the phone | Decided (ARCHITECTURE.md §3.5) | 3 |
| Sign-in and password reset attempts | Brute force | Stricter per-IP and per-account limits | To decide with the auth provider | 1 |
| Journal unlock attempts | Guessing the journal password | Stricter limit with growing lock-out | To decide | 13 |
| Image searches per user per day | Third-party cost and abuse | Daily quota | To decide | 9 |
| Late-data window | Back-dated actions | 7 days; not in the future | Decided | 3 |
| 429 rate for normal users | Limits too tight | < 0.5% of a normal user's requests | Proposed | 3 |

### 3.6 Database

| Metric | Why it matters | Target | Label | Measured with | From |
| --- | --- | --- | --- | --- | --- |
| Single-user indexed read | Every screen load | p95 ≤ 20 ms | Proposed | `EXPLAIN ANALYZE`, logs | 1 |
| Batch read (500 users) | Midnight pipeline | ≤ 500 ms on 100,000 seeded users | Proposed | `EXPLAIN ANALYZE` | 3 |
| Full scans of large tables | Slows as data grows | None in engine or screen queries | Proposed (checked with the `EXPLAIN` rule, DB.md §9) | `EXPLAIN` | 1 |
| Statement timeout | A runaway query can't block others | 10 s | Built | `client.ts` | 0 |
| Idle-in-transaction timeout | Held locks | 30 s | Built | `client.ts` | 0 |
| Pool size per process | Connection budget | 10 | Built | Config | 0 |
| Pool wait (queue) timeout | Fail fast when saturated | 10 s | Built | `client.ts` | 0 |
| Connections in use | Saturation | < 80% of pool and of the server maximum | Proposed | `pg_stat_activity` | Deploy |
| Cache hit ratio | Memory size right | > 99% | Proposed | `pg_stat_database` | Deploy |
| Slow queries | Regressions | Every query > 250 ms logged and reviewed | Proposed | `log_min_duration_statement` | Deploy |
| Disk use | Running out of space | Alert at 70%, act at 80% | Proposed | Host metrics | Deploy |
| Dead rows / vacuum | Bloat after the retention deletes | Autovacuum keeps up; table bloat < 20% | Proposed | `pg_stat_user_tables` | 3 |
| Lock waits | Contention, e.g. on `mana_state` | Rare; version-check retries < 1% of writes | Proposed | Logs | 6 |
| Backups | Data loss | Daily, with point-in-time recovery; restore tested once per phase from Phase 1 | Proposed | Host | Deploy |

### 3.7 Data growth and storage

| Metric | Target or estimate | Label | Source |
| --- | --- | --- | --- |
| Rows written per active user per day (before cuts) | ~28 rows, ~8 KB with overhead | Estimate | DB.md §10.1 |
| Kept long-term per active user | **~3 KB per day**, ~1.2 MB per year | Estimate, adopted cuts | DB.md §10.2 |
| Photos per active user | ~120 KB per day, ~18 MB per year | Estimate | DB.md §10.2 |
| Database per year | ~12 GB at 10,000 DAU · ~120 GB at 100,000 · ~1.2 TB at 1,000,000 | Estimate | DB.md §10.2 |
| Photos per year | ~180 GB at 10,000 DAU · ~1.8 TB at 100,000 · ~18 TB at 1,000,000 | Estimate | DB.md §10.2 |
| Measured vs estimated growth | Within ±25%; a bigger gap triggers a review of the tables and the cuts | Proposed | Measured from Phase 3 |
| Retention jobs | Delete on schedule: completions and glasses after 30 days, walk blocks after 7, engine runs and weekly analytics after 90 | Decided | DB.md §10.3 |
| Partitions created ahead | Next month always exists by the 20th | Proposed | Phase 3 |

**Data per action (estimates from DB.md §10.1; measured in Phase 3):**

| Action | Rows written | Bytes stored | Requests |
| --- | --- | --- | --- |
| Tick a habit | 1 | ~300 B | 1, or part of a batched sync |
| Add a glass of water | 1 | ~210 B | 1, or part of a batched sync |
| Step sync | 1 (replaces the day's count) | ~130 B | 1 per sync |
| Walk (5-minute blocks, kept 7 days) | ~1 per 5 minutes | ~35 B each | Part of the walk sync |
| Daily challenge | 1 | ~220 B | 1 |
| Journal entry | 1 | ~1.5 KB | 1 |
| Photo identification | ~2 (search, sighting; card only for a new species) | ~650 B + ~400 KB photo | 2 (upload, then result) |
| Midnight close, per user | ~11 (frozen items, summaries, run markers, mana) | ~2 KB, part of it deleted later by the retention rules | 0 (worker) |

### 3.8 Worker and midnight pipeline

| Metric | Why it matters | Target | Label | From |
| --- | --- | --- | --- | --- |
| Heartbeat | Silent worker death | Every minute; a missed check-in alerts (Sentry Crons) | Built | 0 |
| Leader changes | Instability | ~0 per day outside deploys | Proposed | 0 |
| Job overruns and job errors | Jobs piling up | 0; every one is reported | Built (reporting) | 0 |
| Users closed per time zone | Midnight on time | All within **15 minutes** of local midnight | Proposed (ARCHITECTURE.md §6.2) | 3 |
| Batch size and parallelism | Database load | 500 users per batch, up to 4 batches at once | Proposed | 3 |
| Database calls per 100,000 users | Efficiency | ~1,600 | Estimate (ARCHITECTURE.md §6.1) | 3 |
| Days closed twice / mana credited twice | Correctness | **0**, guaranteed by unique keys | Decided | 3 |
| Batch retries and splits | Bad data | Each reported; split batches < 1% | Proposed | 3 |
| Users processed vs expected | Nobody skipped | Equal, every night | Proposed | 3 |

### 3.9 Offline sync

| Metric | Target | Label | From |
| --- | --- | --- | --- |
| Actions accepted / duplicate / rejected | Rejected < 0.5%; every rejection has a reason code shown on the phone | Proposed | 3 |
| Actions arriving after their day closed | Counted; each amends the day and replays mana | Decided | 3 |
| Actions outside the 7-day window | Rejected and shown to the user | Decided | 3 |
| Phone clock corrections | Counted; large corrections logged | Proposed | 3 |

### 3.10 Reliability and availability

| Metric | Target | Label | From |
| --- | --- | --- | --- |
| API availability | 99.9% per month (≤ 43 minutes down) | Proposed | 17 |
| Recovery after a crash | Host restarts the process within 1 minute | Proposed | Deploy |
| Silent failures | 0: every error is logged with a request id and reported | Decided | 0 |
| Time to detect a down service | ≤ 5 minutes (health checks and missed heartbeats) | Proposed | Deploy |

### 3.11 Security

| Metric | Target | Label | From |
| --- | --- | --- | --- |
| High or critical vulnerabilities in runtime dependencies | 0 (CI fails) | Proposed | 0 |
| Moderate vulnerabilities in development tools | Tracked; fixed when the fix doesn't break the toolchain | Proposed | 0 |
| Secrets in git | 0 (scanner in CI) | Decided (§3.6 rules) | 0 |
| Routes reachable without login | Only `/health` and `/health/ready` | Built, tested | 0 |
| Security tests per endpoint (other users' data, malformed input, limits) | 100% of endpoints, every phase | Decided (ARCHITECTURE.md §3.6) | 1 |
| Personal data in logs and error reports | None (redaction on; Sentry collection off) | Built, tested | 0 |
| Failed sign-ins per IP / account | Watched; spikes alert | Proposed | 1 |
| Time to patch a critical vulnerability | ≤ 7 days | Proposed | Deploy |
| Security headers on every response | Present (helmet) | Built, tested | 0 |

### 3.12 Third-party services

| Metric | Target | Label | From |
| --- | --- | --- | --- |
| Species lookups served from our cache | Rising over time; > 80% after the first months | Proposed (the no-repeat lookup rule) | 9 |
| Identification service latency and errors | p95 ≤ 3 s; failures shown, never silent | Proposed | 9 |
| Identification quota use | Alert at 80% of the plan | Proposed | 9 |
| Auth provider availability | Watched; errors reported | Proposed | 1 |

### 3.13 Cost

| Metric | Target | Label | From |
| --- | --- | --- | --- |
| Hosting cost per 1,000 daily active users per month | Tracked from launch; reviewed when traffic doubles | Proposed | Deploy |
| Database and photo storage vs estimate (§3.7) | Within ±25% | Proposed | 3 |
| Identification cost per user per month | Within the plan's budget | Proposed | 9 |

---

## 4. Request and data budget per user per day

A typical active user (DB.md §10.1): 5 habits scheduled and 4 ticked, 1 step sync, a walk every 2 days, 6 glasses, 1 daily challenge, and a photo and a journal entry every 3 days.

| | Estimate |
| --- | --- |
| API requests | ~30 (≈ 5 app opens × ~3 requests + actions; fewer when actions are batched in `/sync`) |
| Upload (no photos) | ~20 KB |
| Download (no photos) | ~150 KB |
| Photos | ~130 KB upload (a photo every 3 days) |
| Database rows written | ~28; ~3 KB kept long-term |

Measured in Phase 3 and corrected here.

---

## 5. Capacity model

Planning estimates, replaced by k6 measurements as they come in.

| Daily active users | Requests per day | Average | Peak hour (15% of the day) | Short bursts (3× peak) |
| --- | --- | --- | --- | --- |
| 10,000 | ~300,000 | ~3.5 per s | ~12.5 per s | ~40 per s |
| 100,000 | ~3 million | ~35 per s | ~125 per s | ~400 per s |
| 1,000,000 | ~30 million | ~350 per s | ~1,250 per s | ~4,000 per s |

- **API, measured 2026-11-24** (k6 on a Windows development laptop; server and k6 on the same machine; logs off; full request pipeline on `GET /v1/session`):

  | Rate | Failed | p95 | Max |
  | --- | --- | --- | --- |
  | 500 per s | 0% | 0.84 ms | 18 ms |
  | 1,000 per s | 0% | 0.68 ms | 33 ms |
  | 1,500 per s | 0.17% | 2.5 ms | 214 ms |
  | 2,000 per s | 0.33% | 3.8 ms | 211 ms |
  | 3,000 per s | 1.4% | 34 ms | 385 ms |

  The failures were **refused connections** (the connection queue filling up on one machine), not crashes or errors. The server stayed up. The breakpoint ramp stopped itself past 1% failures at about 474,000 requests.
- **Clean capacity of one instance: about 1,000 requests per second**, with zero failures. Real routes do more work than this one, and production logs every request, so the number is re-measured on the staging host (Linux, behind its load balancer) in the deployment stage. Even so, short bursts at 100,000 daily users (~400 per second) leave about 2.5× headroom.
- **Database:** the likely bottleneck. Kept safe by indexed per-user reads (§3.6), batched engine work, and the connection budget (§3.4).
- **Midnight:** the biggest single load is one large time zone reaching midnight at once. At 100,000 users that is 200 batches of 500, about 1,600 database calls, inside the 15-minute window.

---

## 6. Limits and timeouts in force

What the code enforces today, in one place. Change these only together with this table.

| Setting | Value | Where |
| --- | --- | --- |
| Rate limit | 120 per minute per user, or per IP before login | `RATE_LIMIT_PER_MINUTE`, `services/backend/src/api/app.ts` |
| Access-control order | 1. Identify the caller from the token (never rejects) → 2. Rate limit → 3. Refuse callers without a login. All before the body is read | `app.ts` |
| Body limit | 256 KB | `BODY_LIMIT_BYTES` |
| Request timeout | 30 s | `app.ts` |
| Connection timeout | 10 s | `app.ts` |
| Graceful shutdown | 15 s, then forced exit | `main.ts` |
| Database pool | 10 connections per process | `DATABASE_MAX_CONNECTIONS` |
| Statement timeout | 10 s (server side and client side) | `packages/data/src/client.ts` |
| Idle in transaction | 30 s | `client.ts` |
| Pool queue and connect timeouts | 10 s each | `client.ts` |
| Worker leadership retry | 30 s | `worker.ts` |
| Scheduler stop | waits up to 10 s for running jobs | `scheduler.ts` |

---

## 7. Load balancing and scaling policy (Proposed)

Summary of §3.4, to confirm with you at the deployment stage:

1. The API holds no state between requests, so any copy can serve any request. No sticky sessions.
2. Production runs at least 2 API copies behind the host's load balancer, which sends traffic only to copies whose `/health/ready` passes.
3. Deploys are rolling: a new copy must pass readiness before an old one is drained. Old copies finish in-flight requests within 15 seconds.
4. The worker is never load-balanced. Exactly one copy is active; it is the only one holding the PostgreSQL leader lock.
5. Total database connections across all copies stay under 80% of the database's maximum.
6. Before running a second API copy, the rate limiter moves to a shared store. Otherwise each copy counts separately and the real limit doubles.

---

## 8. Measurement tools

| Area | Tool |
| --- | --- |
| Unit, route and integration tests | Vitest (backend), Jest + RNTL (mobile) |
| Load | k6 (local and staging; in CI for smoke runs) |
| End-to-end on phones | Maestro |
| Frame rate | Perf Monitor, Xcode Instruments, Flashlight |
| Query plans | `EXPLAIN (ANALYZE, BUFFERS)` on seeded data |
| Database health | `pg_stat_activity`, `pg_stat_database`, `pg_stat_user_tables`, slow-query log |
| Errors and heartbeats | Sentry (with personal-data collection off), Sentry Crons |
| Logs | pino structured logs with request ids |
| Dependencies and secrets | `npm audit`, gitleaks |
| Web security scan | OWASP ZAP baseline (staging) |

---

## 9. Test log

Every test run that matters, newest first. Failures stay in the log.

| Date | Phase · stage | Test | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-24 | 0 · Testing | Whole repo, as in CI: typecheck, lint, layer lint, db:check, all suites | ✅ 106 tests | Mobile 48, backend 38, internal API 2, migration check 12, data layer 6 |
| 2026-11-24 | 0 · Testing | k6 steady rates on `/v1/session` | ✅ ≤ 1,000 per s clean · ⚠ ≥ 1,500 per s | See §5; refused connections, not errors |
| 2026-11-24 | 0 · Testing | k6 breakpoint (ramp to 6,000 per s over 3 min) | ⚠ Stopped itself past 1% failures | ~474,000 requests; p95 153 ms when stopped; refused connections |
| 2026-11-24 | 0 · Testing | k6 rate-limit check (limit 120) | ✅ Pass (second run) | Signed-in user: exactly 120, then 429 with `RATE_LIMITED` and a request id. No login: 401s, then 429. First run failed only on the test's own counting |
| 2026-11-24 | 0 · Testing | k6 smoke (2 users, 30 s) | ✅ Pass | p95: `/health` 1.6 ms, `/health/ready` 2.4 ms, `/v1/session` 1.4 ms; 0 failures; 360/360 checks |
| 2026-11-24 | 0 · Testing | Layer-boundary lint (dependency-cruiser 18.9.0) | ✅ No violations | Each rule proven with deliberate bad files (all caught, then deleted). Two rule bugs found and fixed |
| 2026-11-24 | 0 · Testing | API security tests: rate limit for callers without a login | ❌ → ✅ | Found: never limited. Fixed in `app.ts`; 3 new tests |
| 2026-11-24 | 0 · Testing | Local gitleaks scan | ⛔ Not run | Blocked by this computer's permission settings; runs in CI instead |
| 2026-11-24 | 0 · Frontend | Keyboard check on your phone | ✅ Looks good | Confirmed by you |
| 2026-11-24 | 0 · Frontend | `npm audit` after adding keyboard-controller | ✅ No new advisories | Same 2 moderate tooling advisories (glob, minimatch); 0 high or critical; 1 package added |
| 2026-11-24 | 0 · Frontend | Android and iOS bundles (`expo export`) | ✅ Build · 4.3 MB each | First bundle-size baseline |
| 2026-11-24 | 0 · Frontend | Typecheck, lint, expo-doctor | ✅ Pass | expo-doctor 20/20 |
| 2026-11-24 | 0 · Frontend | Lint rule against React Native's own `ScrollView` / `KeyboardAvoidingView` | ✅ Fires | Checked with a sample file: both imports rejected |
| 2026-11-24 | 0 · Frontend | Mobile unit tests after keyboard avoidance | ✅ 48/48 | 3 new: scroll-page settings, fixed-page offset, text field focus and label |
| 2026-11-24 | 0 · Database | `npm run db:migrate` on `wildself_dev` | ✅ Pass | No migration files yet; safety check and connection OK |
| 2026-11-24 | 0 · Database | `.env` check (true/false only, no values shown) | ❌ → ✅ | Dev password on line 21 didn't match; you fixed it |
| 2026-11-24 | 0 · Backend | API and worker on local PostgreSQL 17 (test database) | ✅ Pass | `/health/ready` 200 with database ok; `/v1/session` and unknown routes 401; dev login 200; of 2 workers only 1 led; heartbeat ran on the minute |
| 2026-11-24 | 0 · Database | Migration tool on `wildself_test` | ✅ Pass | Nothing to apply |
| 2026-11-24 | 0 · Database | Data-layer integration tests (6) on local PostgreSQL 17 | ✅ 6/6, 4 runs in a row, ~1.6 s | After fixing the tests |
| 2026-11-24 | 0 · Database | Data-layer integration tests, first run | ❌ 3/6 failed | Test mistakes: wrong column name; crash faked with a polite close (5 s wait, timed out); a knock-on failure. Code was right |
| 2026-11-24 | 0 · All | Whole repo: typecheck + all suites | ✅ 100 tests | Mobile 45, backend 35, internal API 2, migration check 12, data layer 6 |
| 2026-11-24 | 0 · Backend | Production build | ✅ 21 KB | Started and answered |
| 2026-11-24 | 0 · Backend | Smoke test without a database | ✅ Pass | `/health` 200 with security headers; `/health/ready` 503, cause logged, hidden from caller; `/v1/session` 401 |
| 2026-11-24 | 0 · Backend | `npm audit` | ⚠ 2 moderate | Only in Jest and Expo tooling; none in backend runtime packages; the forced fix breaks Expo |
| 2026-11-24 | 0 · Backend | Graceful shutdown on stop signal | ⏳ Not testable on Windows | Verify on Linux in the deployment stage |
| 2026-11-24 | 0 · Frontend | Your test with `npm run mobile:perf` | ✅ Much smoother | 120 fps still to confirm on a production build |
| 2026-11-24 | 0 · Frontend | Your review on your phone (Expo Go, development mode) | ❌ Not 120 fps | Led to native press feedback, indicator timing, iOS 120 Hz key, perf script |
| 2026-11-24 | 0 · Frontend | Font assets | ✅ 5.1 MB → 1.1 MB | Only the 6 weights used are bundled |
| 2026-11-23 | 0 · Frontend | Typecheck, lint, expo-doctor, unit tests, bundles | ✅ Pass | expo-doctor 20/20, 45 tests, Android and iOS bundles build |

---

## 10. Improvement backlog

Open items from tests and reviews. Closed items stay, with the date.

| # | Item | Found | Plan | Status |
| --- | --- | --- | --- | --- |
| 1 | 120 fps not yet verified on a production build (now including keyboard movement) | 2026-11-24, your review | EAS development build on your 120 Hz phone; Android highest-refresh-rate setting | ⏳ Phase 0 deployment |
| 2 | No CI yet | Phase 0 | GitHub Actions: typecheck, all tests (with a PostgreSQL service), `db:check`, `npm audit`, gitleaks, layer-boundary lint, k6 smoke | ✅ Built 2026-11-24 (`.github/workflows/ci.yml`) |
| 3 | No load baseline | Phase 0 | k6 smoke, breakpoint and rate-limit check | ✅ Done 2026-11-24 (§5) |
| 4 | Rate-limit counters are kept in each API process | 2026-11-24, while writing §3.4 | Shared store (PostgreSQL table or Redis-compatible) before running 2 API copies | ⏳ Before a second copy |
| 5 | Graceful shutdown not verified | Phase 0 (Windows) | Test on Linux in the container | ⏳ Phase 0 deployment |
| 6 | JS bundle size not yet recorded | 2026-11-24 | Record the baseline from `expo export` | ✅ Recorded 2026-11-24: 4.3 MB |
| 11 | Keyboard avoidance not yet seen on a real phone | 2026-11-24 | Your check; then a Maestro flow per form from Phase 1 | ✅ You confirmed it on your phone, 2026-11-24 |
| 12 | Fixed-page keyboard offset relies on the window height the library reads | 2026-11-24 | Re-check on Android edge-to-edge with the first fixed page that has a field (forms use scroll mode) | ⏳ Phase 1 |
| 13 | **Callers without a login were never rate-limited** (login was checked before the limit) | 2026-11-24, Phase 0 testing | Identify → limit → refuse order; 3 new tests; k6 check | ✅ Fixed 2026-11-24 |
| 14 | Refused connections above ~1,000 requests per second on one instance (laptop) | 2026-11-24, k6 | Re-measure on the Linux staging host; add a second copy before traffic nears the limit (§3.4) | ⏳ Phase 0 deployment |
| 15 | `TRUST_PROXY` must be on behind the host's proxy, or all users share one IP's rate limit | 2026-11-24, k6 | Set in the deployment config, with a test that reads the real client IP | ⏳ Phase 0 deployment |
| 16 | Local secret scan blocked by this computer's permission settings | 2026-11-24 | gitleaks runs in CI on the full history on every push | ✅ Covered by CI |
| 17 | k6 rate-limit test first failed: public health checks share the per-IP allowance | 2026-11-24 | Behaviour is correct; the test now allows for up to 5 earlier calls from the same IP | ✅ Fixed in the test |
| 7 | Response compression not enabled | 2026-11-24 | Turn on for JSON over 1 KB when the first larger responses appear | ⏳ Phase 1–3 |
| 8 | Event-loop delay not measured | 2026-11-24 | Add a `perf_hooks` monitor that logs p99 | ⏳ Phase 1 |
| 9 | 2 moderate `npm audit` findings in tooling | 2026-11-24 | Re-check at every Expo upgrade | ⏳ Watching |
| 10 | Integration tests faked a crash politely | 2026-11-24 | Crash now simulated by the server killing the connection | ✅ Fixed 2026-11-24 |

---

## 11. Stage reports

A report is written in [reports/](reports/) after every development and testing stage. You review it, and it is pushed to GitHub only after you confirm.

**File name:** `phase-NN-<stage>.md`, for example `phase-00-backend.md`.

**Sections:**

1. **Execution Against Plan:** what happened, and whether it followed the plan or deviated.
2. **Deviation Analysis and Remediation:** for each deviation, the cause and the solution put in place.
3. **Adequacy of the Planned Approach:** for what went to plan, whether the planned solution was enough.
4. **Summary Matrix:** one table of every item, its outcome and its status.

| Report | Phase · stage | Date | Pushed |
| --- | --- | --- | --- |
| [phase-00-frontend.md](reports/phase-00-frontend.md) | 0 · Frontend | 2026-11-24 | Pushed on your instruction, 2026-11-24 |
| [phase-00-backend.md](reports/phase-00-backend.md) | 0 · Backend | 2026-11-24 | Pushed on your instruction, 2026-11-24 |
| [phase-00-database.md](reports/phase-00-database.md) | 0 · Database | 2026-11-24 | Pushed on your instruction, 2026-11-24 |
| [phase-00-testing.md](reports/phase-00-testing.md) | 0 · Testing | 2026-11-24 | Pushed on your instruction, 2026-11-24 |
