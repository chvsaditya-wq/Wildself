---
name: metrics-and-testing-guide
description: "docs/metrics_and_testing.md is the guide to maintain and improve metrics; test every stage with the tests that fit the stack (unit, integration, k6, etc.) and record results there"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T09:06:44.221Z
---

Use `docs/metrics_and_testing.md` as the standard of reference and working notebook for performance and security metrics. After every development stage of every phase:
1. Test it with what fits the stack and module: unit tests, integration tests on real PostgreSQL, k6 load tests (smoke, load, stress, spike, soak, breakpoint, rate-limit check), EXPLAIN on seeded data, Maestro, frame-rate checks on production builds, npm audit, and secret scanning.
2. Record every run (pass or fail) in its test log §9 and compare it with the targets in the categorized metric tables §3 (client, network/API, server, load balancing, rate limits, database, data growth, worker, offline sync, reliability, security, third-party, cost).
3. Add misses to the improvement backlog §10, and update targets, measurements and §6 "limits in force" when code changes.

Targets are labelled Decided / Built / Proposed. Proposed targets must be confirmed with the user before the phase they matter for.

**Why:** User instruction 2026-11-24. They want performance and security kept "consistent and near perfect", with metrics such as database growth rate, data per user per action, server load, rate limits and load-balancing policies tracked and improved over time.

**How to apply:** Part of finishing every stage, together with [[update-docs-after-each-stage]] and [[phase-stage-reports]]. Follow [[security-first]] and [[smoothness-120fps]] targets. Never load-test production.
