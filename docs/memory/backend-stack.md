---
name: backend-stack
description: "Approved backend stack for Wildself (2026-11-24) — always-on Node/Fastify, managed Postgres, not serverless; Supabase Auth for sign-in only; host deferred"
metadata:
  node_type: memory
  type: project
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-27T05:39:53.472Z
---

Approved 2026-11-24: Node.js 22 + TypeScript + Fastify 5 + Zod, one build with `api` and `worker` roles (services/backend), always-on small Docker container at a low-cost host (Fly.io / Railway / Render — choose by current price before Phase 0 deployment stage), managed PostgreSQL (Neon or Supabase-hosted) in staging/prod, local PostgreSQL 17 in dev. Not serverless. **Auth: Supabase Auth, chosen by the user 2026-11-24**, used for sign-in only (Apple, Google, email). Our API verifies tokens locally with JWKS (jose, ES256), user id = `sub`, and our DB stores no email or password. The plan and user setup steps are in docs/AUTH.md, built in Phase 1. CI: .github/workflows/ci.yml (actions pinned to SHAs); layer lint: dependency-cruiser; load tests: k6 scripts in tests/load/. Code lives at github.com/chvsaditya-wq/Wildself (branch main). **The repo is PUBLIC**: the user chose on 2026-11-27 to keep it public, so anything committed is world-readable. Never commit secrets or personal data. A copy of this memory lives in docs/memory/ in the repo.

**Why:** User asked for "least cost of operation and best efficiency", fast, easy, no silent failures, few API calls; user is not a backend engineer and delegated the choice. User initially thought NestJS = serverless; it is not.

**How to apply:** Don't reintroduce serverless or NestJS without a new reason. Commit/push only when the user asks. Related: [[security-first]], [[strict-layer-separation]].
