---
name: phase-stage-reports
description: "After every development and testing stage, write a report in docs/reports/ in the user's 4-section format; push only after the user reviews and confirms"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T09:06:52.526Z
---

After each development and testing stage, write `docs/reports/phase-NN-<stage>.md` (e.g. `phase-00-backend.md`) with a metadata table, then these four sections. The user said "three sections" but listed four; all four are used:
1. **Execution Against Plan**: what happened; did it follow the plan or deviate?
2. **Deviation Analysis and Remediation**: for each deviation, the cause, the solution and how it was verified.
3. **Adequacy of the Planned Approach**: for items that went to plan, whether the planned solution was enough, with evidence.
4. **Summary Matrix**: a table of item, planned, outcome, deviation, resolution and status.

The user's questions must never be used as headings. Reframe them as technical headings (as above). List each report in the §11 table of metrics_and_testing.md.

**Push rule:** do not commit or push reports, or the work they cover, until the user has reviewed the report and confirmed the push.

**Why:** User instruction 2026-11-24.

**How to apply:** The report is the last step of every stage, after [[update-docs-after-each-stage]] and [[metrics-and-testing-guide]]. Ask for review, then wait for confirmation before pushing.
