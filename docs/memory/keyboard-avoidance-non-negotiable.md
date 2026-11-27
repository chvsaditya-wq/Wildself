---
name: keyboard-avoidance-non-negotiable
description: Keyboard avoidance and scroll inset adjustments are non-negotiable on every screen and sheet; report any difficulty to the user immediately
metadata:
  node_type: memory
  type: feedback
  originSessionId: 44e91a3a-7121-4606-8b0d-a89c9513c44e
  modified: 2026-11-24T09:31:04.194Z
---

The keyboard must never cover the field being typed in or its submit button, on any screen, sheet or phone. Built in Phase 0 (FRONTEND.md §7.4):
- `react-native-keyboard-controller` (1.22.7 for Expo SDK 58, included in Expo Go), with `KeyboardProvider` in the root layout.
- Scrolling content uses `KeyboardScrollView` (`apps/mobile/src/components`): bottomOffset 24 (`KEYBOARD_GAP`), inset mode, `keyboardShouldPersistTaps="handled"`, and iOS automatic insets off.
- Fixed `Screen` pages use the library's `KeyboardAvoidingView`.
- A lint rule bans React Native's own `ScrollView` and `KeyboardAvoidingView`.
- Pages with text fields use `Screen scroll`.

**Why:** User instruction 2026-11-24: "a non-negotiable feature and MUST be implemented without fail. If you are unable to implement it or face any difficulties, I want you to let me know immediately."

**How to apply:**
- Every new form, sheet (e.g. @gorhom/bottom-sheet in Phase 2) or text input must be verified against this rule. Include it in each frontend stage's exit check and on-phone checks, together with [[smoothness-120fps]].
- If a library or platform limitation blocks it, stop and tell the user right away; don't work around it silently.
