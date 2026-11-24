# Phase 0 — Testing Stage Report

| | |
| --- | --- |
| **Phase · stage** | 0 Foundations · Rigorous testing |
| **Run** | 2026-11-24 |
| **Report date** | 2026-11-24 |
| **Stage status** | Done locally: all suites, layer lint and k6 pass, and one security gap was found and fixed. CI pipeline built; its first run on GitHub happens with this push |
| **Related** | [POA.md](../POA.md) Phase 0 · [metrics_and_testing.md](../metrics_and_testing.md) §2, §3.5, §5, §6, §9, §10 · [ARCHITECTURE.md](../ARCHITECTURE.md) §3.6 · [IMPROVEMENTS_LOG.md](../IMPROVEMENTS_LOG.md) Testing Phase 0 |

---

## 1. Execution Against Plan

**Planned scope:**

- **POA.md Phase 0:** "CI pipeline, lint rules that enforce the layer boundaries".
- **metrics_and_testing.md §2:** k6 smoke, breakpoint and rate-limit checks; dependency audit; secret scanning; security tests for the endpoints that exist.

**What was delivered:**

- **CI on GitHub Actions** (`.github/workflows/ci.yml`), on every push and pull request:
  - typecheck and lint, including the layer boundaries
  - the no-logic migration check
  - all test suites, with the data-layer tests on a real PostgreSQL 17 service
  - migrations applied to a fresh database
  - a production build of the server
  - k6 smoke and rate-limit checks against the built server
  - a separate security job: `npm audit` (fails on high or critical vulnerabilities in runtime dependencies) and a gitleaks secret scan of the whole git history
  - every third-party action pinned to a full commit SHA, and the gitleaks download checksum-verified
- **Layer-boundary lint:** dependency-cruiser 18.9.0 (`.dependency-cruiser.cjs`, `npm run lint:layers`), with 8 rules covering the 4 layers, database drivers and circular imports.
- **Load tests (`tests/load/`):** `smoke.js`, `steady.js`, `breakpoint.js`, `rate-limit.js`. All four were run locally with k6 2.4.0, downloaded with its checksum verified.
- **Security tests:** 3 new API tests for rate limits on callers without a login, unknown routes, and separate counting per user.
- **Result:** 106 tests pass (mobile 48, backend 38, internal API 2, migration check 12, data layer 6). Typecheck, lint, layer lint and the migration check are clean.

**Verdict: delivered to plan, with deviations.** The stage found a real security gap and fixed it, found two bugs in its own lint rules, and corrected one load test. One planned local check, the secret scan on this computer, was blocked by permission settings and moved to CI.

---

## 2. Deviation Analysis and Remediation

### 2.1 Security gap: callers without a login were never rate-limited

- **Found by:** a new API test, written before any change. It failed: 4 calls in a row without a valid login all got 401, and none got 429.
- **Cause:**
  - The login check ran before the rate limit, so a request without a valid login was refused before it was counted.
  - Anyone could therefore send unlimited requests to guess tokens or probe for routes.
  - The rule "rate limits per user and per IP" (ARCHITECTURE.md §3.6) wasn't met for the IP part.
- **Remediation:** the access-control steps in `services/backend/src/api/app.ts` now run in a safe order, all before the request body is read:
  1. Identify the caller from the token, without rejecting yet.
  2. Apply the rate limit: per user if identified, per IP otherwise.
  3. Refuse callers without a login.
- **Verification:**
  - 3 new tests pass: callers without a login are limited by IP, unknown routes are limited, and each signed-in user is counted separately.
  - All 35 earlier backend tests still pass.
  - The k6 rate-limit check on the built server confirmed it: 401s, then 429 at the limit.

### 2.2 Two bugs in the layer rules, found by testing the rules themselves

- **How:** each rule was tested with a deliberately bad file. The bad files were caught and then deleted, and none were committed.
- **Bug 1:** the exclude list also removed `node_modules`, so the rule "only the data layer talks to PostgreSQL" could never fire.
  - **Fix:** `node_modules` is now not followed instead of excluded, so the imports themselves are still checked.
- **Bug 2:** the first circular-import sample didn't actually form a cycle, so it proved nothing.
  - **Fix:** re-tested with a real two-file cycle, which was caught.
- **Verification:** every rule now catches its violation. The real code has no violations (109 modules, 248 imports checked).

### 2.3 Rate-limit load test failed on its first run

- **Observed:** callers without a login got 119 answers of 401 and 11 of 429; the test expected exactly 120 and 10.
- **Cause:** the runner's start-up health check came from the same IP. Public health checks share the per-IP allowance, which is correct behaviour.
- **Remediation:** the test allows up to 5 earlier calls from the same IP, while still requiring that every call is either a 401 or a 429 and that the totals add up. The signed-in part stays exact: 120 accepted, then 10 refused.
- **Follow-up:** behind a host's proxy, `TRUST_PROXY` must be on. Otherwise every user arrives from the proxy's IP and shares one allowance (backlog item 15).

### 2.4 Load capacity on one machine

- **Observed:** clean up to **1,000 requests per second**. At 1,500 per second, 0.17% of connections were refused; at 3,000, 1.4%.
- **The ramp test** stopped itself past 1% failures after about 474,000 requests.
- **Cause:** refused connections, meaning the connection queue overflowed on a laptop running both the server and k6. The requests that got through stayed fast (p95 3.8 ms at 2,000 per second), and the server never crashed or returned errors.
- **Assessment:** not a defect at our expected traffic. Bursts at 100,000 daily users are about 400 per second, about 2.5× below the clean limit.
- **Remediation:** re-measure on the Linux staging host, behind its load balancer, with production logging (backlog item 14). The load-balancing policy (metrics_and_testing.md §3.4) adds a second copy before traffic approaches the limit.

### 2.5 Local secret scan blocked

- **Observed:** running gitleaks on this computer was blocked by the session's permission settings.
- **Remediation:** gitleaks runs in CI on the full git history on every push, with its download checksum-verified.
- **Before this push:** the same true/false password check as before confirmed that your real database password isn't in the commit.

---

## 3. Adequacy of the Planned Approach

| Planned item | Was the planned solution enough? | Evidence |
| --- | --- | --- |
| CI on every push | Yes; extended with the security job and k6 | Workflow built. First run with this push |
| Layer boundaries enforced by lint | Yes, after testing the rules themselves | All 8 rules proven with deliberate violations |
| Rate limits "per user and per IP" (ARCHITECTURE.md §3.6) | **Design yes, implementation no**: the order of the checks defeated the per-IP limit | Fixed (§2.1) |
| Security headers, request ids, safe errors | Yes | k6 smoke checked headers and ids on every response; unit tests unchanged |
| Body-size limit | Yes | Unit test; access checks now run before the body is read |
| Single worker leader, crash recovery | Yes | Data-layer tests in CI on PostgreSQL 17 |
| No logic in the database | Yes | Check runs in CI |
| Latency targets (p95 ≤ 50 ms health, ≤ 200 ms reads) | Yes, with large margin at expected load | p95 1.4–2.4 ms in the smoke test; 0.68 ms at 1,000 per second |
| Dependency audit | Yes | 0 high or critical; 2 moderate advisories in development tools only (unchanged) |

---

## 4. Summary Matrix

| Item | Planned | Outcome | Deviation | Resolution | Status |
| --- | --- | --- | --- | --- | --- |
| CI pipeline | Yes | GitHub Actions with PostgreSQL, k6, audit, secret scan; actions pinned to SHAs | Extended | — | ✅ Built · ⏳ first run with this push |
| Layer-boundary lint | Yes | dependency-cruiser, 8 rules | 2 rule bugs | Fixed and proven | ✅ |
| Rate limit before login | Implied by §3.6 | Callers without a login unlimited | **Security gap** | Identify → limit → refuse | ✅ Fixed, tested |
| k6 smoke | Yes | All checks pass; p95 ≤ 2.4 ms | None | — | ✅ |
| k6 rate-limit check | Yes | Exact for signed-in users | Test counting | Test allows earlier health checks | ✅ |
| k6 breakpoint and steady rates | Yes | Clean to 1,000 per second; refused connections above | Laptop limit | Re-measure on staging | ✅ Baseline · ⏳ staging |
| Dependency audit | Yes | 0 high or critical | None | — | ✅ |
| Secret scan | Yes | Blocked locally | Environment | Runs in CI | ⏳ First CI run |
| Tests | All green | 106 pass | None | — | ✅ |
