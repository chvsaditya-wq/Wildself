# Phase 0 — Backend Stage Report

| | |
| --- | --- |
| **Phase · stage** | 0 Foundations · Backend |
| **Built** | 2026-11-24 |
| **Verified on a real database** | 2026-11-24 (your local PostgreSQL 17) |
| **Report date** | 2026-11-24 |
| **Stage status** | Built and verified. **Open:** layer-boundary lint (testing stage); graceful shutdown on Linux (deployment stage) |
| **Related** | [POA.md](../POA.md) Phase 0 · [ARCHITECTURE.md](../ARCHITECTURE.md) §3.6, §6.4, §8 · [IMPROVEMENTS_LOG.md](../IMPROVEMENTS_LOG.md) Backend Phase 0 · [metrics_and_testing.md](../metrics_and_testing.md) §3.3–3.5, §3.8, §6, §9 |

---

## 1. Execution Against Plan

**Planned scope (POA.md Phase 0, ARCHITECTURE.md):** one build with `api` and `worker` roles; the internal API interface; a scheduler skeleton; auth wiring. All of it on the approved stack (Node.js 22, TypeScript, Fastify, Zod, always-on container, PostgreSQL), following the layer rules, the efficiency rules, no silent failures and security first.

**What was delivered:**

- **`services/backend`:** one program; `--role=api` or `--role=worker` is chosen at start-up.
- **API (Fastify 5):**
  - `/health` and `/health/ready` are public; `/v1/session` checks the login chain.
  - Login is required on every other route, including unknown ones.
  - UUID request ids, security headers, a 256 KB body limit, 120 requests per minute per user (or per IP), request and connection timeouts.
  - One safe error format.
- **Worker:** a minute-aligned scheduler that never overlaps a job with itself and reports every failure and overrun. Exactly one leader, through a PostgreSQL lock checked before every tick. A heartbeat every minute, with Sentry Crons check-ins.
- **Configuration:** validated at start-up. The server refuses unsafe production settings: the development login, an unencrypted database connection, or missing error reporting.
- **Observability:** structured logs with secrets redacted; Sentry with every kind of personal-data collection switched off.
- **Shared packages:** `contracts` (error codes and response shapes) and `internal-api` (the typed interface engines will call).
- **Checks:**
  - 35 backend tests and 2 internal API tests.
  - A 21 KB production build that was started and called.
  - Verified on your local PostgreSQL: readiness ok, login enforced, a single leader, the heartbeat running.

**Verdict: delivered to plan, with deviations.** Two were deliberate simplifications. One was a privacy issue found and fixed during the build. Two were environment limits.

---

## 2. Deviation Analysis and Remediation

### 2.1 Sentry's default data collection conflicted with the privacy rules

- **Observed:** Sentry 11 removed the old `sendDefaultPii` switch. By default it now collects user details, cookies, headers, request bodies, query strings, database values and local variables.
- **Risk:** journal text, habit data or login tokens could have reached a third-party service, breaking the security-first rule (ARCHITECTURE.md §3.6).
- **Remediation:** Sentry is set up with every data-collection option off. Our own log redaction (tokens, cookies, secrets) runs before anything is logged.
- **Verification:** configuration covered by tests. Error reports carry only the error, the request id and the component.

### 2.2 Folder layout simplified

- **Planned:** separate `services/api` and `services/worker` folders.
- **Delivered:** one `services/backend` package, with the role chosen at start-up.
- **Why:** the plan's own rule is "one build, two roles". One package gives one build, one container image, and no duplicated configuration or start-up code.
- **Effect:** none on behaviour. ARCHITECTURE.md §8.2 is updated.

### 2.3 Request validation library deferred

- **Planned:** Zod type provider on routes.
- **Delivered:** Zod validates configuration. Phase 0 routes take no request bodies, so route validation is added with the first endpoint that accepts input (Phase 1).
- **Effect:** one dependency fewer for now. The rule "validate everything, reject unknown fields" still applies from the first input route.

### 2.4 Graceful shutdown couldn't be exercised on Windows

- **Cause:** Windows doesn't deliver the stop signal (SIGTERM) the way a Linux container host does.
- **Remediation:** the code is in place: stop taking requests, finish in-flight ones, release the worker lock, close the database, and force an exit after 15 seconds. It is verified on Linux in the deployment stage (backlog item 5 in metrics_and_testing.md).

### 2.5 Stack decision went through a correction

- **Observed:** a misunderstanding came up during the stack choice: NestJS was assumed to be serverless, but it isn't.
- **Remediation:** the options were compared against your criteria (cheap, fast, simple, no silent failures, few API calls). An always-on Fastify server with managed PostgreSQL was chosen, with the reasoning in ARCHITECTURE.md §8.1, and you approved it before any backend code was written.
- **Effect:** no rework. Nothing had been built yet.

### 2.6 npm workspace install crash

- **Cause:** an npm bug when installing into a single workspace.
- **Remediation:** dependencies added to `package.json` by hand, then a full install.
- **Effect:** none on the code.

---

## 3. Adequacy of the Planned Approach

| Planned item | Was the planned solution enough? | Evidence |
| --- | --- | --- |
| One build, two roles | Yes | Both roles start from the same 21 KB build |
| Single active worker through a PostgreSQL lock | Yes, including crashes | Two workers on your database: one led, the other waited. A killed connection frees the lock, and the old leader notices it lost it (data-layer tests) |
| Leader check before every tick | Yes | The scheduler's guard steps the worker down when the check fails (unit tests) |
| Auth: `deny-all` until the provider is chosen | Yes | Unknown routes and `/v1/session` return 401; the dev stub is refused in production by both config and code |
| Security headers, body limit, rate limit | Yes for one API copy | Tested. **Gap found while writing the metrics:** the counters live in each process, so they need a shared store before a second copy runs (backlog item 4) |
| Safe errors | Yes | `/health/ready` returned 503 with the cause logged and hidden from the caller |
| No silent failures | Yes | Every job error, overrun, failed leadership attempt and crash is logged and reported. A missed heartbeat alerts in Sentry Crons |
| Fail-fast configuration | Yes | Tested; error messages name the setting, never its value |
| Always-on container | Not yet tested | The container and the host are chosen in the deployment stage |
| Error reporting with Sentry | **Not enough as planned**: the defaults leak personal data | Fixed (§2.1) |

---

## 4. Summary Matrix

| Item | Planned | Outcome | Deviation | Resolution | Status |
| --- | --- | --- | --- | --- | --- |
| Roles | `services/api` + `services/worker` | One `services/backend`, role at start-up | Yes (layout) | Same rule, simpler build | ✅ |
| API framework | Fastify | Fastify 5.12 | None | — | ✅ |
| Health checks | Liveness and readiness | `/health`, `/health/ready` | None | — | ✅ Verified on your database |
| Auth wiring | Interface until Phase 1 | `deny-all` default, local-only dev stub | None | — | ✅ |
| Security rules (§3.6) | All | Headers, limits, login by default, safe errors, redaction, fail-fast | None | — | ✅ |
| Rate limiting across copies | Not planned | Counters per process | New gap | Shared store before a second copy | ⏳ Before scaling |
| Error reporting | Sentry | Sentry 11 collected personal data by default | Yes (privacy) | All collection off | ✅ |
| Request validation | Zod on routes | Zod for config; routes from Phase 1 | Yes (timing) | Added with the first input route | ⏳ Phase 1 |
| Worker scheduler | Skeleton | Minute-aligned, no overlap, reports failures | None | — | ✅ |
| Single leader | One active worker | PostgreSQL lock, checked every tick | None | — | ✅ Verified on your database |
| Heartbeat | Not in plan detail | Every minute + Sentry Crons | Addition | Catches a silently stopped worker | ✅ |
| Graceful shutdown | Required | Built; not testable on Windows | Yes (environment) | Test on Linux | ⏳ Deployment |
| Stack choice | Approved stack | Fastify + managed PostgreSQL after correcting the serverless question | Yes (process) | Decided and approved before coding | ✅ |
| Tests | Unit tests | 35 backend + 2 internal API | None | — | ✅ |
| Layer-boundary lint | Exit check | Not yet | Planned for testing | dependency-cruiser in CI | ⏳ Phase 0 testing |
