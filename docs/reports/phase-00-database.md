# Phase 0 — Database Stage Report

| | |
| --- | --- |
| **Phase · stage** | 0 Foundations · Database |
| **Built** | 2026-11-24 |
| **Verified on a real database** | 2026-11-24 (your local PostgreSQL 17) |
| **Report date** | 2026-11-24 |
| **Stage status** | Local environment done and verified. **Open:** staging and production databases (deployment stage); monthly partitions (moved to Phase 3) |
| **Related** | [POA.md](../POA.md) Phase 0 · [DB.md](../DB.md) §1, §9, §10 · [IMPROVEMENTS_LOG.md](../IMPROVEMENTS_LOG.md) DB Phase 0 · [metrics_and_testing.md](../metrics_and_testing.md) §3.6, §3.7, §6, §9 |

---

## 1. Execution Against Plan

**Planned scope (POA.md Phase 0, DB.md):** PostgreSQL environments (local, staging, production); the migration tool; the data-layer skeleton; monthly partition creation; a CI check against logic in the database.

**What was delivered:**

- **`packages/data`:**
  - a connection pool that runs every connection in UTC, with timeouts on both ends (statement 10 s, idle in transaction 30 s, connect and queue 10 s)
  - TLS required in production
  - a health ping
  - the worker leader lock
- **Migrations:** node-pg-migrate 9 with plain SQL files, run only through `npm run db:migrate`. It runs the no-logic check first, refuses rollbacks (forward-only), checks the order and takes a migration lock.
- **No-logic check:** rejects functions, procedures, triggers, rules, `DO` blocks, procedural languages, `pg_cron` and generated columns. 12 tests.
- **Local setup guide:** `db/local-setup.md`, with a non-superuser app account and separate development and test databases.
- **6 integration tests** on a real PostgreSQL. They refuse to run on any database whose name lacks "test".
- **Verified on your local PostgreSQL 17:** all 6 tests pass (4 runs in a row), and the first migration ran on `wildself_dev`.

**Verdict: delivered to plan for the local environment, with deviations.**

- **Scope and timing:** partitions moved to a later phase, and staging and production wait for deployment.
- **Environment:** the local database needed your setup.
- **Tests:** they needed corrections when they first ran against the real database.

---

## 2. Deviation Analysis and Remediation

### 2.1 Integration tests failed on their first real run (3 of 6)

- **Observed:** on your database, 3 tests failed.
- **Causes:** all three were mistakes in the tests; the data-layer code was correct.
  1. **Time zone test:** PostgreSQL names the `show timezone` column `TimeZone`, but the test read `tz`. The connection was on UTC all along.
  2. **Lock freed on crash:** the test faked a crash with a polite close. A polite close waits up to 5 seconds for the connection that holds the lock, which overran the test's 5-second limit.
  3. **Released lock:** failed only because test 2 was still holding the lock in the background.
- **Remediation:**
  1. The UTC test now reads `current_setting('TimeZone')`.
  2. The crash test now has the server kill the holder's connection (`pg_terminate_backend`), which is what a real crash or network cut looks like. It also checks a new behaviour: the old holder's lock check fails, so a worker that loses its lock stops running jobs.
  3. Test 3 passes unchanged.
- **Also checked:** the real worker releases its lock before closing at shutdown, so the polite-close delay never affects it.
- **Verification:** 6/6 pass in 4 runs in a row, about 1.6 s each.

### 2.2 Local PostgreSQL wasn't ready

- **Observed:** the PostgreSQL service was stopped, and starting it and creating accounts needs administrator rights and your `postgres` password.
- **Remediation:** a step-by-step guide (`db/local-setup.md`). The password is chosen by you and lives only in the git-ignored `.env`; it is never shared in chat.
- **Verification:** you completed it. The service runs, the account and both databases exist, and the app connects.

### 2.3 Wrong password in `.env`

- **Observed:** the first migration on `wildself_dev` was refused with "password authentication failed".
- **Cause:**
  - `DATABASE_URL` and `TEST_DATABASE_URL` each appeared twice in `.env`, and the last copy wins.
  - The template copies still held the `CHANGE_ME` placeholder.
  - Your `DATABASE_URL` had a different password from the working `TEST_DATABASE_URL`, although both use the same account.
- **How it was found without exposing the secret:** a script compared the values and printed only true/false answers.
- **Remediation:** you corrected the password, and the first migration then ran on `wildself_dev`.
- **Prevention:** `db/local-setup.md` now warns that each setting must appear once and that both URLs must carry the same password.

### 2.4 Monthly partition creation moved to Phase 3

- **Cause:** partitions belong to tables (`habit_completions`, `water_entries` and others) that don't exist until Phase 3. Building the job now would create something with nothing to test it on.
- **Remediation:** moved to Phase 3, where the first partitioned table appears. POA.md and DB.md are updated.

### 2.5 Staging and production databases deferred

- **Cause:** they depend on the host, which is chosen by current prices in the deployment stage.
- **Remediation:** created in the Phase 0 deployment stage, with TLS required (already enforced by the configuration).

---

## 3. Adequacy of the Planned Approach

| Planned item | Was the planned solution enough? | Evidence |
| --- | --- | --- |
| Database only stores and counts, never decides | Yes, and the check is stricter than planned | The no-logic check also rejects `DO` blocks, procedural languages and generated columns; 12 tests |
| Forward-only SQL migrations | Yes | `db:migrate` refuses `down`; ran on both databases |
| Migration lock (no two deploys at once) | Yes | Built into node-pg-migrate and used by the wrapper |
| Worker leader lock in PostgreSQL | Yes, including crashes | Verified on your database with a server-side kill |
| UTC everywhere | Yes | Verified on every connection |
| Query timeouts | Yes | A 3-second query is cancelled at a 1-second limit (integration test) |
| Tests never touch real data | Yes | Tests refuse databases without "test" in the name |
| Least-privilege app account | Yes | `wildself_app` is not a superuser |
| Data growth model (DB.md §10) | Not measurable yet: no tables | Measured in Phase 3 against metrics_and_testing.md §3.7 |

---

## 4. Summary Matrix

| Item | Planned | Outcome | Deviation | Resolution | Status |
| --- | --- | --- | --- | --- | --- |
| Local environment | Local PostgreSQL | Service stopped at first; set up by you | Yes (environment) | Setup guide; you completed it | ✅ |
| Dev credentials | Correct `.env` | Wrong dev password, duplicate lines | Yes (configuration) | Found without exposing it; you fixed it | ✅ |
| Staging and production | Phase 0 | Deferred to the deployment stage | Yes (timing) | Created with the host | ⏳ Deployment |
| Migration tool | node-pg-migrate or dbmate | node-pg-migrate 9, SQL, forward-only | None | — | ✅ Ran on `wildself_dev` |
| No-logic check | Functions, procedures, triggers, rules, pg_cron | Stricter, 12 tests | Addition | — | ✅ |
| Data layer | Skeleton | Pool, UTC, timeouts, TLS in production, ping, leader lock | None | — | ✅ |
| Integration tests | On a real PostgreSQL | 3/6 failed first (test mistakes) | Yes (tests) | Tests fixed; crash test strengthened | ✅ 6/6, 4 runs |
| Partition creation | Phase 0 | Moved to Phase 3 | Yes (timing) | With the first partitioned table | ⏳ Phase 3 |
| CI for migrations | Planned | Check ready; CI not yet set up | — | GitHub Actions in the testing stage | ⏳ Phase 0 testing |
