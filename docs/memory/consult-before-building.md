---
name: consult-before-building
description: "Never start development without the user's explicit command; ask detailed questions and get exact behaviour before designing any feature or architecture piece"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-20T11:32:55.150Z
---

Do not write application code, migrations or queries until the user explicitly says to start (e.g. "start Phase 0"). Before specifying the behaviour of any feature, engine or architecture piece, ask the user detailed questions; they will say exactly how it should work, and only then is it built. Delivery order per feature: Frontend -> Backend -> DB migrations -> Testing -> Deploy, one feature at a time.

**Why:** The user (2026-11-20) wants to own every behavioural decision in the nature habit app and explicitly said "ONLY START development on my command" and "consult me before writing the behavior for any features or architecture".

**How to apply:** When a task touches unspecified behaviour, list concrete questions (with worked examples) and stop. Planning docs are fine; code is not, until commanded. See [[strict-layer-separation]] and [[docs-as-local-markdown]].
