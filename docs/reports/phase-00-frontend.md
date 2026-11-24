# Phase 0 — Frontend Stage Report

| | |
| --- | --- |
| **Phase · stage** | 0 Foundations · Frontend |
| **Built** | 2026-11-23 |
| **Reviewed on device** | 2026-11-24 (your phone) |
| **Changes made and re-tested** | 2026-11-24 |
| **Report date** | 2026-11-24 |
| **Stage status** | Design approved. Smoothness much improved in production mode. Keyboard avoidance added and **confirmed by you on your phone** (2026-11-24). **Open:** 120 fps verification on a production build (needs the deployment stage) |
| **Related** | [POA.md](../POA.md) Phase 0 · [FRONTEND.md](../FRONTEND.md) · [IMPROVEMENTS_LOG.md](../IMPROVEMENTS_LOG.md) Frontend Phase 0 · [metrics_and_testing.md](../metrics_and_testing.md) §3.1, §9 |

---

## 1. Execution Against Plan

**Planned scope (POA.md Phase 0, FRONTEND.md):** an Expo app in a monorepo; design tokens; base components; the tab shell (Home, Discover, Analytics, Settings); the slide-out menu shell; the offline action queue; the performance tool set; the frame-rate budget.

**What was delivered:**

- `apps/mobile` on Expo SDK 58 (React Native 0.88.1, React 19.3, TypeScript 6) in an npm-workspaces monorepo, with Expo Router.
- Light and dark design tokens, DM Sans + Literata fonts, Feather icons.
- Base components (text, buttons, cards, loading, empty and crash states, top bar, tab bar, segmented switch, slide-out menu) and a design preview page.
- Navigation: stack → slide-out menu → four tabs, with placeholder pages for Profile, Journal, Personal collection and My Habits.
- Motion on the UI thread, with Reduce Motion respected everywhere.
- On-device key-value storage for the theme and the offline queue.
- Checks: typecheck, lint, expo-doctor 20/20, 45 unit tests, Android and iOS bundles.

**Verdict: delivered in scope, with deviations.**

- **Design** went to plan and you approved it on the first review.
- **Performance** deviated: the first device review did not meet the 120 fps rule.
- **Storage** deviated: on-device storage changed from the planned MMKV library to expo-sqlite.
- **Build:** several toolchain problems came up and were solved during the build.

---

## 2. Deviation Analysis and Remediation

### 2.1 Frame rate below the 120 fps requirement

- **Observed:** on your phone the app did not feel like 120 fps. You then set 120 fps as non-negotiable, raising the planned budget of 60 fps on Android and 120 fps on iPhone to 120 fps on every 120 Hz screen.
- **Causes found:**
  1. Press feedback was started from JavaScript touch events, so every press waited for the JavaScript thread.
  2. The tab-bar and theme-switch indicators started moving only after React re-rendered.
  3. iOS caps apps at 60 fps on ProMotion iPhones unless the `CADisableMinimumFrameDurationOnPhone` key is set, and it was missing.
  4. The test ran in development mode in Expo Go, which adds debug checks and uses Expo Go's own frame-rate setting. That mode can't show real performance.
- **Remediation:**
  1. Press feedback moved to Gesture Handler's native `Touchable`: the platform animates the shrink and tone itself, 80 ms in and 220 ms out, without JavaScript.
  2. The indicators now start gliding on the tap itself.
  3. The iOS 120 Hz key was added in `app.json`.
  4. `npm run mobile:perf` was added to test in production mode.
- **Verification:** you re-tested with `mobile:perf` and found it **much smoother**.
- **Residual:** 120 fps still has to be proven on a production build of our own app on a 120 Hz phone, and Android still has to request the phone's highest refresh rate. Both need an EAS development build (deployment stage).

### 2.2 On-device storage: MMKV replaced by expo-sqlite

- **Cause:** MMKV needs native code that Expo Go doesn't include, so the app couldn't run in Expo Go for your reviews.
- **Remediation:** an expo-sqlite key-value store behind the same small interface.
- **Effect:** Phase 0 stores only the theme and the offline queue, so speed is not affected. The choice is revisited once development builds exist.

### 2.3 Font payload larger than needed

- **Cause:** importing the font packages bundled every weight, 5.1 MB.
- **Remediation:** per-weight imports of only the 6 weights used.
- **Result:** 1.1 MB. Text never flashes or jumps on launch, because the splash screen is held until the fonts load.

### 2.4 Toolchain and test problems during the build

| Problem | Cause | Fix |
| --- | --- | --- |
| npm install crashed ("Cannot read properties of null") | npm bug with workspace installs | Dependencies added to `package.json` by hand, then a clean install |
| Component tests failed | Two copies of React (19.3.0 and 19.3.1) | Root `overrides` pins one React version; clean reinstall |
| Jest couldn't load Reanimated's native module | Reanimated 4 needs its own Jest resolver | Reanimated's Jest resolver added |
| Tests broke after upgrading React Native Testing Library | Version 14 made rendering and events asynchronous | Tests now wait for them |
| Native `Touchable` tests failed on Windows | Drive-letter case (`D:` vs `d:`) made a Jest mock miss its target | Stub mapped through `moduleNameMapper` |
| Invalid Jest setting | Misspelled key | Removed |
| Button typing error | Props typed too loosely | Props rewritten |

None of these changed what the app does. They are recorded so they aren't hit again.

### 2.5 Keyboard avoidance and scroll inset adjustments added as a non-negotiable requirement

- **Observed:** the plan had no rule for the on-screen keyboard. Phase 0 had no text fields, but Phase 1 (sign-in and onboarding) is mostly forms. You made keyboard avoidance non-negotiable on 2026-11-24, with any difficulty to be reported immediately.
- **Risk without it:** React Native's own `KeyboardAvoidingView` behaves differently on iOS and Android and runs through JavaScript. Android's edge-to-edge mode, which React Native 0.88 always uses, no longer resizes the window for the keyboard. So fields would hide behind the keyboard, or move late and stutter, breaking the 120 fps rule.
- **Remediation:**
  - `react-native-keyboard-controller` 1.22.7, the version Expo SDK 58 recommends. It is included in Expo Go, so no development build is needed. `KeyboardProvider` wraps the app.
  - Every scroll view became `KeyboardScrollView`:
    - the focused field is scrolled 24 pt above the keyboard
    - the keyboard height is added as a content inset, moving the indicator too, with no re-layout
    - iOS's automatic insets are off, so nothing is added twice
    - taps work while typing, and dragging dismisses the keyboard
  - Fixed pages use the library's `KeyboardAvoidingView` (padding, automatic offset). The offset removes the tab-bar clearance, so content ends 24 pt above the keyboard.
  - A themed `TextField` was added, with a keyboard check section on the design preview page.
  - A lint rule now blocks React Native's own `ScrollView` and `KeyboardAvoidingView`.
- **Difficulties:** none blocking. Two things are checked rather than assumed:
  1. The library docs online describe a newer version, so every option used was checked against the installed 1.22.7 code.
  2. On Android, the fixed-page offset depends on the window height the library reads. Pages with text fields use the scroll mode, which doesn't depend on it.
- **Verification:**
  - 3 new unit tests, 48 in total.
  - Typecheck, lint (the rule was checked to fire), expo-doctor 20/20, and both bundles at 4.3 MB.
  - No new `npm audit` advisories.
  - **You checked it on your phone: "looking good" (2026-11-24).**

---

## 3. Adequacy of the Planned Approach

| Planned item | Was the planned solution enough? | Evidence |
| --- | --- | --- |
| Design tokens, colours, type, spacing, light and dark | Yes | You approved the design on the first review |
| Tab and screen layout from the mockup and your sketch | Yes | Approved with no changes |
| Tab transition (cross-fade and 8 pt drift on the native driver) | Yes, already on the UI thread | Not involved in the smoothness problem |
| Menu drift (Reanimated, UI thread) | Yes | Not involved in the smoothness problem |
| Reduce Motion support | Yes | Covered by unit tests |
| Metro `inlineRequires`, React Compiler | Yes for Phase 0; their real effect shows on larger screens | Cold start measured from Phase 3 |
| Performance tools not needed yet (FlashList, expo-image, `LayoutAnimation`, shared transitions, Rive or Lottie) | Not tested yet: no Phase 0 screen needs them | Used from the phases that add lists, images and micro-interactions |
| Original press feedback (Reanimated spring started from JavaScript touches) | **No**: it waited for JavaScript | Replaced (§2.1) |
| "Profiler and Flashlight" as the frame check | **Not enough on its own**: the measurement must be on a production build | Rule added: judge only `mobile:perf` or production builds (FRONTEND.md §7.3) |

---

## 4. Summary Matrix

| Item | Planned | Outcome | Deviation | Resolution | Status |
| --- | --- | --- | --- | --- | --- |
| Monorepo and Expo app | Expo, TypeScript, monorepo | Expo SDK 58, npm workspaces | None | — | ✅ |
| Design system | Tokens, fonts, icons | Built | None | — | ✅ Approved |
| Navigation shell | 4 tabs + slide-out menu | Built, with placeholder pages | None | — | ✅ |
| Frame rate | 60 fps Android / 120 fps iPhone | Not 120 fps on first review | Yes | Native press feedback, indicators start on the tap, iOS key, production-mode testing | ⏳ Verify on a production build |
| Frame-rate target | Proposed budget | Raised by you to 120 fps everywhere | Yes (scope) | FRONTEND.md §7.3 updated | ✅ |
| On-device storage | MMKV | expo-sqlite key-value store | Yes | Runs in Expo Go; revisit with development builds | ✅ |
| Fonts | DM Sans + Literata | 5.1 MB, then 1.1 MB | Yes (size) | Per-weight imports | ✅ |
| Advanced performance tools | Set up in Phase 0 | Deferred | Yes (timing) | Added with the first screens that need them | ⏳ Later phases |
| Toolchain | Builds cleanly | 7 problems solved | Yes (process) | See §2.4 | ✅ |
| Checks | Typecheck, lint, tests | 45 tests, expo-doctor 20/20, bundles build | None | — | ✅ |
| Android highest refresh rate | Not planned | Required by the 120 fps rule | New item | Config plugin in the development build | ⏳ Deployment |
| Keyboard avoidance and scroll insets | Not planned | Made non-negotiable by you | New requirement | keyboard-controller on every screen, inset-based scrolling, lint-enforced, `TextField` | ✅ Built and confirmed on your phone |
| JS bundle size | Track every release | First baseline 4.3 MB | None | — | ✅ Recorded |
