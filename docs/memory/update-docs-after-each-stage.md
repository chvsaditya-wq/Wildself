---
name: update-docs-after-each-stage
description: "After every building stage/phase, update the POA checklist for all phases, sync every doc, and add an IMPROVEMENTS_LOG.md entry in the user's fixed format"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T09:06:55.230Z
---

After each building stage (Frontend, Backend, Migrations, Testing, Deployment) of any phase:
1. Update the progress checklist in docs/POA.md for all affected phases.
2. Update FRONTEND.md, ARCHITECTURE.md and DB.md to match what was actually built (deviations, decisions, status lines).
3. Add/update the entry in docs/IMPROVEMENTS_LOG.md in this exact format: **Part** (Frontend / Backend / DB), **Phase name**, then "1. What was in plan", "2. What was done", "3. Required changes (if any)", "4. Comparison table". "What was done" keeps the original implementation; later changes go in section 3 and in the comparison matrix (columns: aspect, in plan, original implementation, after changes, status).
4. Log every instruction the user gives in the log's "Instructions log" table (newest first, with where it was applied).

**Why:** User instructions on 2026-11-24 ("update the Checklist for all phases, and for all documents after each building phase"; "create an improvements logs document where all the changes for each phase and everything I tell you to do is updated"). The docs are the engineering guide for the app.

**How to apply:** Doc sync is part of finishing every stage, before reporting back. Tick a box only when its exit check passes (on-device checks need the user). Also update docs/metrics_and_testing.md and write the stage report ([[metrics-and-testing-guide]], [[phase-stage-reports]]). Related: [[docs-as-local-markdown]], [[consult-before-building]], [[smoothness-120fps]].
