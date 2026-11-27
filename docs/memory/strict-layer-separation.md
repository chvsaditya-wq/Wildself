---
name: strict-layer-separation
description: "User mandates 4 strictly separated layers - DB/data layer is CRUD-only, engines only calculate, API is the sole path between engines and DB"
metadata:
  node_type: memory
  type: project
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-23T10:20:05.056Z
---

Architecture rule set by the user on 2026-11-20 for the nature habit app (d:\nature-app-project, docs/ARCHITECTURE.md):
- 4 layers: client app (records user actions), engines (calculation only), API (only communication path), data layer (CRUD only).
- 6 engines as of 2026-11-23: Habit tracker, Step tracker, Water tracker, Mana, Analytics, Image search. Midnight pipeline at each user's local 00:00: Habit → Step → Water → Mana. Mana engine is planned together with step and water trackers.
- Product rules (2026-11-23): habits are ultimate — unlogged days are missed, never skipped; streak needs ≥2 days; offline actions count by phone time (7-day late window); day follows phone's current time zone; dormant users (14 days) paused then caught up as missed; tickets bought with mana are the only cover for a day (ticket rules still open). Multiplier starts on day 3 and is not permanent (cap + reset, also reset on new habit — design deferred); a ticket replaces a missed day and keeps streak/multiplier. Only client-side calculation allowed: rounding photo location to ~500 m before upload (privacy). Data: keep only what is used; all retention cuts adopted; now() only for bookkeeping timestamps.
- 4 efficiency rules approved 2026-11-23: atomic grouped writes (one transaction per engine result), batches of ~500 users, SQL may count/sum but never decide, engines call the internal API in-process (one build, `api` + `worker` roles).
- DB operations contain nothing but CRUD; no logic in SQL (no triggers/procedures/cron doing calculations).
- Engines compute, then persist results by calling the API, which executes the query. Engines never touch the DB directly.

**Why:** User wants calculation and raw-data recording kept apart so each can change independently.

**How to apply:** Any design or code that puts logic in the DB, or gives an engine a DB driver, violates this. Related: [[consult-before-building]].
