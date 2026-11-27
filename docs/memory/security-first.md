---
name: security-first
description: Security is a priority in every phase of the Wildself app; new features (e.g. batched /sync) must not introduce security issues
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T07:06:23.760Z
---

Keep security as a priority while building every part of the app (user, 2026-11-24, when approving the batched POST /sync improvement "but it must not cause any security issues").

**Why:** The user is not a backend engineer and relies on me to keep the system safe; they made approval of efficiency improvements conditional on security.

**How to apply:** Follow ARCHITECTURE.md §3.6: user identity only from the verified token, per-resource authorisation, strict schema validation (reject unknown fields), parameterised SQL only, secrets only in env (never in git, never ask the user to paste them in chat), fail-fast config, no internal details in error responses, size/rate limits, security headers, npm audit, and security tests in every phase's testing stage. When proposing any optimisation, state its security rules alongside it. Related: [[strict-layer-separation]], [[update-docs-after-each-stage]].
