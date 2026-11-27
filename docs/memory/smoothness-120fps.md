---
name: smoothness-120fps
description: 120 fps is non-negotiable for the Wildself app; press feedback must be native and smoothness is only judged on production builds
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T06:11:22.310Z
---

The app must run at 120 fps on every 120 Hz phone; the user calls this non-negotiable (2026-11-24, after reviewing Phase 0 in Expo Go — design approved, smoothness not).

**Why:** The product's core promise is an ASMR-like, ultra-smooth feel; the user rejects anything that feels below 120 fps.

**How to apply:**
- Press feedback uses Gesture Handler 3's native `Touchable` (wrapped as `PressableScale` in apps/mobile/src/components) — never a JS-triggered press animation.
- All other motion on the UI thread (Reanimated worklets / native driver); start animations on the tap, not after a React re-render.
- iOS needs `CADisableMinimumFrameDurationOnPhone: true` (set in app.json); Android needs a highest-refresh-rate request via a config plugin in the dev build (planned).
- Never judge smoothness in Expo Go dev mode; use `npm run mobile:perf` or a production EAS build and verify 120 fps with Perf Monitor / Instruments before ticking any Frontend stage.
Related: [[update-docs-after-each-stage]].
