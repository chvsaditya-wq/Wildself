# Wildself — Frontend Plan

_As of 2026-11-24 · Phase 0 frontend built in `apps/mobile`, awaiting your review_

The app should feel like a high-craft botanical field journal: light, smooth and calming to touch, so every tap gives a small, satisfying, almost ASMR-like response. **Smoothness is non-negotiable.** Every screen, list and transition is judged first on how it feels, then on how it looks.

> **Status (2026-11-24):** Phase 0 built the foundations described here: tokens (§3–6), base components, tab bar, slide-out menu, theme switch, offline queue and performance settings (§7). You reviewed it on a phone: **the design meets your expectations; 120 fps is not reached yet.** Press feedback was moved to native code and the iOS 120 Hz setting added; 120 fps is verified on a production build (§7.3). Screens for later phases are placeholders. Items marked **(proposed)** still need your yes or no; choices made during the Phase 0 build are listed in §13.4.

**Related docs:** [POA.md](POA.md) (plan and progress) · [ARCHITECTURE.md](ARCHITECTURE.md) (backend) · [DB.md](DB.md) (database) · [IMPROVEMENTS_LOG.md](IMPROVEMENTS_LOG.md) (changes and instructions)

---

## 1. Ground rules (set by you)

1. **Smoothness above everything.** Light, fluid, tactile. Clearly highlighted buttons, flowing UI, seamless liquid-like movement between screens, beautiful colour. **120 fps is non-negotiable** (2026-11-24) on every phone whose screen supports it (§7.3).
2. **Design reference:** a high-craft botanical field journal crossed with an Apple Design Award wellness app (Flighty, Tiimo, Opal). Tactile, warm, editorial, never corporate.
3. **Never use:**
   - pure white (#FFFFFF) cards or pure black (#000000) text
   - 1 px hairline grey borders (e.g. #E5E7EB)
   - heavy Material-style drop shadows
   - dense KPI metric boxes (big number + green arrow + tiny grey label)
   - harsh red notification dots, urgent badges or gamified confetti
4. **Performance tools to use:** FlashList, expo-image (or FastImage) with BlurHash/ThumbHash, Metro `inlineRequires`, Reanimated-based skeletons, Reanimated worklets, `LayoutAnimation`, `Animated` with `useNativeDriver: true`, shared element transitions, Rive or Lottie for micro-interactions.
5. **Home layout and navigation follow your hand sketch** (2026-11-23), described in §9.
6. **Steps and water tiles are always shown on Home.** There is no option to hide them.
7. **Habits sit in their own scroll box.** The box has the same background as the page. The scrollbar appears only while scrolling and fades calmly into the background. Tapping a habit's tick mark or its name strikes it through, turns it very light and marks it done for the day.
8. **One exception to rule 3:** thin rules above and below each habit row in the habits box. They are drawn in a warm tone close to the background (never grey #E5E7EB), just visible enough to separate the rows (§9.2).

---

## 2. Design direction

**The idea:** each screen is a page from a personal field journal. Habits are entries, species are pressed specimens, the calendar is a nature diary. Colour comes from the landscape the user is walking through, not from a UI kit.

**The one signature moment (proposed):** the **specimen reveal**. When a picture is identified, the species card unfolds like a herbarium sheet: the photo settles onto sand-coloured paper and the scientific name writes itself in italic serif. Below it, a collection label appears with the date, place and "first encounter" if it is new. Everything else in the app stays quiet and disciplined so this moment lands.

**Two references:** the first mockup sets the *look*: warm paper background, sand cards, deep forest green for actions, soft rounded shapes, generous spacing, floating pill tab bar. Your hand sketch sets the *layout and navigation* (§9). Where they differ, the sketch wins.

---

## 3. Colour

Tones separate surfaces. There are no grey lines and no heavy shadows. All values are proposed and checked for WCAG AA text contrast.

### 3.1 Light theme ("Daylight")

| Token | Hex | Role |
| --- | --- | --- |
| `paper` | #F5F2EB | Screen background |
| `sand` | #E8E1D5 | Cards, day chips, tab bar |
| `sage-mist` | #DFE7DA | Challenge card, highlighted surfaces |
| `forest` | #2E6B4F | Primary actions, selected states, checkmarks |
| `forest-deep` | #24563F | Pressed state of forest |
| `bark` | #4E3F33 | Headings and body text |
| `lichen` | #6B5D51 | Secondary text (darker than the mockup's #7A6C5F, which reaches only 3.9:1 on sand; #6B5D51 reaches 4.9:1) |
| `moss` | #8FA67A | Progress fills, streak marks |
| `lake` | #5E8A9A | Water tracker, water-related species |
| `pollen` | #C9A24B | Level-ups and rewards: a soft gold glow, used rarely |

Checked contrast: forest on sage-mist 4.9:1, paper on forest 5.6:1, lichen on sand 4.9:1.

### 3.2 Dark theme ("Dusk", proposed)

| Token | Hex | Role |
| --- | --- | --- |
| `paper` | #1F2420 | Deep moss charcoal, never pure black |
| `sand` | #2A302B | Cards |
| `sage-mist` | #2F3A31 | Highlighted surfaces |
| `forest` | #7FB596 | Primary actions (lightened for dark) |
| `bark` | #EDE6DA | Text, never pure white |
| `lichen` | #B5AA9C | Secondary text |

### 3.3 Colour rules

- Surfaces are separated by tone steps (paper → sand → sage-mist), never by borders.
- Floating elements (tab bar, capture button, sheets) may use one **soft warm shadow (proposed):** bark-tinted, 24–32 px blur, at most 6% opacity. Nothing else casts a shadow.
- The notification indicator is a small **moss** dot, as in the mockup. Never red.
- Errors use a muted clay tone with plain words, never alarm red.
- **Seasonal tints (proposed):** `moss` and `pollen` shift slightly with the season (spring greener, autumn more amber). The core tokens never change.

---

## 4. Typography

| Role | Typeface (proposed) | Use |
| --- | --- | --- |
| UI | **DM Sans** (matches the mockup) | Buttons, labels, habit titles, body |
| Editorial | **Literata** (a serif built for reading on screens) | Species names, journal entries, the day story in the calendar, level titles |
| Scientific names | Literata Italic | *Alcedo atthis*: the field-guide touch |

| Style | Size / line height | Face |
| --- | --- | --- |
| Display | 34 / 40 | DM Sans Regular |
| Title | 22 / 28 | DM Sans Medium |
| Editorial title | 26 / 32 | Literata Medium |
| Body | 16 / 24 | DM Sans Regular |
| Journal body | 17 / 27 | Literata Regular (more line height for serif) |
| Meta | 13 / 18 | DM Sans Medium, `forest` or `lichen` |

Fonts are embedded at build time (expo-font config plugin), so text never flashes or jumps on launch. Type scales with the system's text-size setting.

---

## 5. Layout and shape

- **Grid:** 24 px screen margins, 8 px spacing steps, 16 px between cards (as in the mockup).
- **Radius by hierarchy:** 28 px for cards, full pill for buttons, chips and the tab bar, 20 px for photos inside cards, 36 px for sheets. Radius follows the role of the element; not everything gets the same rounding.
- **Alignment:** left-aligned text everywhere except the level-up moment and empty states.
- **Line length:** journal text stays under 70 characters per line.
- **Touch targets:** at least 48 × 48 pt, including the habit tick circle.

---

## 6. Motion system

Motion answers what the user did. It shows what changed and settles calmly. No motion plays on its own except one orchestrated reveal of the Today screen on app launch.

### 6.1 Motion tokens (proposed)

| Token | Definition | Used for |
| --- | --- | --- |
| `press` | spring, damping 20, stiffness 400 | Button and card press-in / release |
| `settle` | spring, damping 18, stiffness 180 | Cards, sheets, tab indicator, list changes |
| `drift` | 420 ms, ease-out-quint (0.22, 1, 0.36, 1) | Screen-level fades and hero transitions |
| `pulse` | 1.2 s opacity loop 0.45 ↔ 0.8 on the UI thread | Skeleton shimmer |

No linear easing, and no motion longer than 500 ms except the level-up moment.

### 6.2 Interaction feel

| Interaction | Motion | Haptic | Sound (proposed, §13) |
| --- | --- | --- | --- |
| Any press | Scales to 0.97 and deepens one tone; springs back on release | — | — |
| Tick a habit (tap its tick mark **or** its name) | The tick box fills with forest like spreading ink and the check draws itself; then a line draws across the habit name from left to right and the text fades to very light | Light impact | Soft wooden "tock" |
| Untick (tap again, until 23:59) | The line retracts, the text returns to full colour, the ink drains back | Selection | — |
| Scroll the habits box | A thin scrollbar fades in while scrolling and fades out about 0.6 s after scrolling stops | — | — |
| Tap the bookmark on a challenge | The hollow bookmark pops to 1.15× on `press`, fills from bottom to top with the theme's primary colour, and settles | Light impact | — |
| Tap the Water tile or its + button | One more glass: the glass fills a step with a small liquid wobble | Light impact | Soft pour |
| Open the menu (hamburger) | Menu slides in from the left on `settle`; Home dims and drifts 24 px right | Selection | — |
| Switch tab | Indicator glides; content cross-fades with an 8 px drift | Selection | — |
| Last habit of the day done | A soft moss glow passes across the habits box once | Success | Gentle chime |
| Specimen reveal | Signature moment (§2) | Success | Paper rustle |
| Level-up | Full-screen calm moment: background warms to pollen, a leaf unfurls, the new title is set in Literata | Success | Low bell |
| Pull to refresh | A leaf curls with the pull and uncurls when done (Rive) | — | — |

**Highlighted buttons:** the primary button is a solid `forest` pill with `paper` text. When pressed it scales and deepens to `forest-deep`. Secondary buttons are `sage-mist` with `forest` text. Android's Material ripple is replaced with this same tonal press, so both platforms feel identical.

### 6.3 Screen transitions

| From → to | Transition |
| --- | --- |
| Tab ↔ tab | Cross-fade + 8 px drift (`drift`) |
| Home ↔ menu | Slide-out menu from the left (§6.2) |
| Personal collection → species card | The photo flies from the grid into the card header (shared element) |
| Menu → Create habit | Bottom sheet rises on `settle`; background dims to 30% bark |
| Profile icon → Profile | Native stack push; the avatar grows into the profile header (shared element) |
| Home challenge card → challenge page | The card's image expands into the page's header image (shared element) |
| Challenge page → camera | Page fades through to the Discover camera |
| Journal locked → unlocked | Lock dissolves; pages fan in |

### 6.4 Which animation tool, when

1. **Press feedback runs natively.** Every tappable element uses Gesture Handler's native `Touchable` (wrapped as `PressableScale`): the platform recognises the touch and runs the shrink and the deeper tone itself, so feedback appears on the next frame without touching JavaScript. Changed from a Reanimated press animation on 2026-11-24 (see IMPROVEMENTS_LOG.md).
2. **Reanimated** (UI-thread worklets) is the default for everything else that is interactive, gesture-driven or shared between screens, so a busy JS thread never drops a frame. Indicators (tab bar, segmented control) start gliding on the tap itself, not after React re-renders.
3. **`LayoutAnimation`** is for simple one-off layout changes outside lists, such as expanding a single card or toggling a section. Inside FlashList we call FlashList's `prepareForLayoutAnimationRender()` first.
4. **`Animated` with `useNativeDriver: true`** is allowed only for standalone opacity or transform fades where Reanimated adds nothing.
5. **Rive or Lottie** for illustrated micro-interactions: the tick check, tab icons, pull-to-refresh leaf, level-up leaf (one tool, §13).
6. **Shared element transitions** use Reanimated's `sharedTransitionTag`. Support has changed between Reanimated versions, so in Phase 0 we check it on the exact version we pin. If it is not stable there, we use our own measured hero transition, which looks the same.

**Reduce Motion:** when the system setting is on, movement becomes simple cross-fades and nothing slides or scales. Haptics stay.

---

## 7. Performance rules

### 7.1 Required tools

| Need | Tool | Rule |
| --- | --- | --- |
| Long lists and grids | **FlashList v2** (Shopify) | Never `FlatList` or `ScrollView` + `map` for more than ~20 items. Used for the species collection, journal list, saved challenges and image searches |
| Images | **expo-image** | Disk and memory cache, background decoding, a **ThumbHash** placeholder for every photo, 200 ms cross-fade on load. FastImage is not used: it has seen little maintenance in recent years and expo-image covers the same needs |
| Startup | **Metro `inlineRequires: true`** | Heavy modules (camera, charts, journal editor) load only when their screen opens |
| Loading states | **Reanimated skeletons** | Plain `View` blocks in `sand`, opacity pulsing on the UI thread. No SVG-mask shimmer packages, no spinners |
| Animation | **Reanimated** worklets | All interactive motion on the UI thread |
| Press feedback | **Gesture Handler `Touchable`** (native) | Shrink and tone change run by the platform; no JavaScript on the press path |
| Tab transitions | React Navigation bottom tabs, native driver | Cross-fade + drift runs on the UI thread (checked in the library source) |

### 7.2 Platform settings

- **iOS 120 Hz:** `CADisableMinimumFrameDurationOnPhone = true` in the iOS Info.plist (set in `app.json`). Without it, iOS limits apps to 60 fps on ProMotion iPhones. Takes effect in our own builds, not in Expo Go.
- **Android high refresh rate (planned):** a small config plugin asks Android for the screen's highest refresh rate, built and tested with the first development build (Phase 0 deployment stage).
- **Performance testing in production mode:** `npm run mobile:perf` runs the app without development checks. The normal `npm run mobile` is noticeably slower and is never used to judge smoothness.
- New Architecture (Fabric) and Hermes on; both are Expo's current defaults.
- **React Compiler** on, to cut needless re-renders without manual memoisation.
- Navigation via Expo Router on native stacks (`react-native-screens`), so pushes use the platform's own animator.
- Data work is deferred until a transition has finished; nothing heavy runs mid-animation.
- Photos are resized on the phone before upload; grids load thumbnails sized to the cell, never full photos.
- Lean dependencies: no moment.js, no full lodash, no UI kits. Bundle size is tracked every release.

### 7.3 Budgets

| Measure | Target |
| --- | --- |
| Frame rate | **120 fps, non-negotiable**, on every 120 Hz screen (ProMotion iPhones, 120 Hz Android phones). Phones with 60 or 90 Hz screens: their maximum |
| Dropped UI-thread frames during any transition | 0 in the profiler |
| Press feedback and tick feedback | Visual change on the next frame (8.3 ms at 120 Hz), haptic in the same tap |
| Cold start to interactive Today | ≤ 1.5 s on iPhone 13; ≤ 2.5 s on the reference Android phone |
| Collection of 500 species cards | Fast scroll with no blank cells |
| Flashlight performance score on key flows | ≥ 90 |

**Measured with:** Flashlight (Android performance score), React Native DevTools profiler, the Perf Monitor overlay, Xcode Instruments (iOS frame pacing), and Reassure for render-count regressions in CI.

**How 120 fps is verified:** only on a production-mode build of our own app (a development or preview build from EAS), on a 120 Hz phone, with the Perf Monitor or Instruments showing 120 fps on the UI thread through every transition in the phase. Expo Go in development mode cannot prove it: it runs extra development checks, and on iPhone it uses Expo Go's own frame-rate setting rather than ours.

---

## 8. Frontend and the layer rules

The app is **Layer 1 (client / recording)** in [ARCHITECTURE.md](ARCHITECTURE.md). It records what the user does and shows what the API returns.

- The app **never calculates** mana, streaks, multipliers, levels or analytics. It displays the values the API returns.
- **One approved exception, for privacy:** before uploading a photo, the app rounds its location to about 500 m and strips location data from the image file, so the exact location never leaves the phone.
- **Optimistic ticks:** a tick shows instantly and is sent in the background. If sending fails, the tick stays and is queued on the phone with the moment it happened and a unique action id, then sent once the phone is back online. It counts for that day even if it arrives after midnight (ARCHITECTURE.md §3.4). The same queue holds unticks and water glasses. Mana updates only when the API confirms it.
- The app talks only to the API, through the typed `api-client` package. It never talks to the database or the engines.

---

## 9. Navigation and screens

### 9.1 Navigation (from your sketch)

**Bottom tab bar, four tabs:**

| Tab | What it holds |
| --- | --- |
| **Home** | The daily screen (§9.2) |
| **Discover** (renamed from Image search) | Top: image search (take or upload a picture, search it online, get the card). Middle: daily challenges. Bottom: special challenges, which appear based on season or location. Only the image search part is designed now; the challenge sections come in Phases 11 and 15 |
| **Analytics** | Habits, images searched, steps and water (§10) |
| **Settings** | Theme (light / dark), haptics, sounds, account |

**Hamburger menu (top left), slides in from the left:**

- **Journal**: the private, locked journal
- **Personal collection**: every nature subject the user has photographed and identified
- **My Habits**: the only place to create, edit and delete habits
- **App settings shortcuts**, such as the light / dark theme switch: the same settings as the Settings tab

**Profile icon (top right):** opens Profile, which shows **mana and level** (moved here from Home) and **saved challenges**.

### 9.2 Home screen

```text
┌────────────────────────────────────┐
│ ≡    Good morning, Alex       (◯)  │  menu · greeting · profile
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Daily challenge                │ │  1 challenge a day
│ │ Spot a kingfisher near water   │ │  tap → challenge page (§9.3)
│ └────────────────────────────────┘ │
│ ┌───────────────┐ ┌──────────────┐ │
│ │ Steps         │ │ Water        │ │  always shown; words only
│ └───────────────┘ └──────────────┘ │  until Phases 4 and 5
│ Habits                             │
│  ────────────────────────────────  │
│  Wake up at 5                 [✓]  │  done: struck through, very light
│  ────────────────────────────────  │
│  Drink water                  [ ]  │
│  ────────────────────────────────  │
│  Breathe by the water         [ ]  │  box background = page;
│  ────────────────────────────────  │  scrollbar only while scrolling
│                                    │
│   (  ⌂      ◎      ▥      ⚙  )     │  Home · Discover · Analytics · Settings
└────────────────────────────────────┘
```

| Part | Behaviour |
| --- | --- |
| Hamburger | Opens the slide-out menu (§9.1) |
| Greeting | Sits between the hamburger and the profile icon, e.g. "Good morning, Alex" |
| Profile icon | Opens Profile: mana, level, saved challenges |
| Daily challenge card | Shows **one** challenge for the day, chosen by season and location. Tapping it opens the challenge page (§9.3) |
| Steps tile | Always shown. Until Phase 4 it contains only the word "Steps". From Phase 4 it shows all-day steps and a small **Start / Stop** button for walks |
| Water tile | Always shown. Until Phase 5 it contains only the word "Water". From Phase 5, tapping the tile adds a glass, and a **+** button next to the glass does the same |
| Habits box | Same background colour as the page. Shows only habits scheduled for today. Its own scroll area; the scrollbar appears only while scrolling and fades out calmly |
| Row rules | A thin rule above and below each habit, in a warm tone just darker than the page: visible enough to separate rows, quiet enough not to be noticed (proposed: 1.5 pt, `sand`) |
| Tick mark or habit name | Tap either → the habit is struck through, turns very light and is marked completed for today (§6.2). Tap again to undo, until 23:59. Completed habits stay where they are |
| Editing or deleting | Not possible from the box; only in **My Habits** in the menu |

**How the scroll box stays smooth (proposed, H11):** the Home screen itself does **not** scroll. The header, challenge card and tiles keep a fixed height, and the habits box fills the rest of the screen and is the only thing that scrolls. With only one scroll area there is no scroll-inside-scroll, which is what usually makes nested lists stutter. On the smallest supported phone (iPhone SE height) the box still shows about three habits. The scrollbar is our own thin indicator drawn with Reanimated, because the native one cannot be styled or faded this way.

### 9.3 Challenge page (Phase 11)

```text
┌────────────────────────────────────┐
│ ‹                                  │
│ ┌────────────────────────────────┐ │
│ │                           [⌑]  │ │  hollow bookmark, top right
│ │     image or collage of the    │ │
│ │     subject                    │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│ Common kingfisher                  │  common name
│ Alcedo atthis                      │  scientific name, italic
│ Names in the region's languages    │  e.g. one line per language
│                                    │
│ A short paragraph in English about │
│ the subject and where to look for  │
│ it at this time of year.           │
└────────────────────────────────────┘
```

| Part | Behaviour |
| --- | --- |
| Image | A single image or a collage of the subject (bird, tree or other natural subject) |
| Names | Common name, then its names in the region's languages (which languages: §13.2) |
| Description | A short paragraph, always in English |
| Bookmark | Hollow at first. Tapping it animates, fills with the theme's primary colour, and saves the challenge for later (§6.2). Saved challenges are listed in Profile |
| Completing | Photographing the subject through image search completes the challenge and gives extra mana (amount later). The photo joins the personal collection with its details, date and time. Not completing it changes nothing |

### 9.4 All screens

| Screen | Tab / entry | Phase | Notes |
| --- | --- | --- | --- |
| Welcome, sign up, log in, reset password | — | 1 | One quiet illustrated welcome; no carousel of feature slides |
| Onboarding: name, body details, permissions | — | 1 | 3 short steps, each skippable except name |
| Home | Home tab | 3 | From your sketch (§9.2) |
| Slide-out menu | Hamburger | 0 (shell), filled as features land | §9.1 |
| My Habits: list, create, edit, delete | Menu | 2 | Schedule (all days, except Sunday, custom days) and optional time window; delete confirmation shows the mana cost (proposed) |
| Step tracker detail, walk history | Home tile | 4 | Start / Stop button on the tile |
| Water tracker detail | Home tile | 5 | Spec to come |
| Profile: mana, level, title | Profile icon | 6 | Tickets added in 7, saved challenges in 11, rewards in 16 |
| Level-up moment | Overlay | 6 | Signature-level calm, no confetti |
| Late-sync note | Home | 3 | Calm note, e.g. "Monday's habits synced. Your streak continues." |
| Tickets: buy and use | Profile (proposed) | 7 | Rules to be set |
| Reminder notifications | System | 8 | Calm wording, e.g. "Time for Breathe by the water" |
| Discover: image search (camera / upload) | Discover tab, top | 9 | Large capture button with soft shadow |
| Identifying | Discover tab | 9 | Photo blurs gently while the engine works |
| Specimen card | Discover, Personal collection | 9 | Signature reveal; shows date and time found |
| Personal collection | Menu | 9 | FlashList grid of identified subjects, grouped by type |
| Challenge page | Home card, Discover | 11 | §9.3 |
| Saved challenges | Profile | 11 | — |
| Discover: daily challenges section | Discover tab, middle | 11 | Not designed yet |
| Analytics | Analytics tab | 12 | Written field notes + gentle charts (§10) |
| Journal lock, entries, editor | Menu | 13 | — |
| Nature calendar, day story | To confirm (§13.2) | 14 | — |
| Discover: special challenges section | Discover tab, bottom | 15 | Not designed yet; declining is as easy as accepting |
| Rewards | Profile | 16 | — |
| Settings | Settings tab, shortcuts in menu | 0–1 | Theme, haptics, sounds, account |

---

## 10. Analytics without KPI boxes

Analytics read like notes in a field journal, not a dashboard:

- **A written line first:** "You stepped outside on 18 of 30 days this month, mostly on weekend mornings."
- **Then one gentle chart:** soft area or dot-strip charts in `moss` and `lake`, with no gridlines and labels written on the chart itself.
- **Collections as specimens:** "18 birds, 12 trees, 7 flowers" shown as a small cluster of their own photos, not number tiles.
- **Home tiles follow the same rule:** a filling ring for steps and a filling glass for water, with the numbers written in body text, never oversized.
- Charts are drawn with react-native-svg animated by Reanimated. Skia is added only if Phase 12 proves it necessary.

---

## 11. Words in the app

- Sentence case, plain verbs, no exclamation marks. "Take a closer look", not "Complete now!".
- Buttons name what happens, and the same word follows through: "Save habit" → "Habit saved".
- Errors say what happened and what to do: "Couldn't identify this photo. Try one with the subject closer and in focus."
- Empty states invite action: "Nothing collected yet. The next leaf, bird or bloom you notice can be your first."

---

## 12. Folder structure and libraries

```text
apps/mobile/
├── app/                     Expo Router routes (one file per screen)
│   ├── (auth)/
│   ├── (drawer)/            slide-out menu: journal, personal collection
│   ├── (tabs)/home, discover, analytics, settings
│   ├── profile/
│   └── sheets/
├── src/
│   ├── design/              tokens: colour, type, spacing, radius, motion
│   ├── components/          primitives: Pressable, Button, Card, Chip, Sheet, Skeleton, TabBar
│   ├── motion/              springs, shared transitions, haptics, sounds
│   ├── features/            my-habits, home, profile, discover, collection, challenges, reminders, steps, water, analytics, journal, calendar
│   ├── api/                 TanStack Query hooks over packages/api-client
│   └── lib/                 dates, formatting, offline queue
└── assets/                  fonts, Rive/Lottie files, sounds
```

| Library | Purpose |
| --- | --- |
| expo, expo-router, react-native-screens | App, navigation, native transitions |
| @react-navigation/drawer (through Expo Router's Drawer) | Slide-out menu |
| react-native-reanimated, react-native-gesture-handler | Motion and gestures on the UI thread |
| @shopify/flash-list (v2) | Lists and grids |
| expo-image | Images with ThumbHash placeholders |
| expo-haptics, expo-audio | Haptics and soft sounds |
| rive-react-native **or** lottie-react-native | Micro-interactions (§13) |
| @gorhom/bottom-sheet | Sheets (Reanimated-based) |
| @tanstack/react-query, zustand | Server data, UI state (added when the first API calls arrive) |
| expo-sqlite (`kv-store`) | On-device storage: theme choice, offline action queue. Chosen in Phase 0 instead of MMKV because it runs in Expo Go, so the app can be reviewed on a phone without a development build. Behind a small interface, so it can be swapped later |
| @expo/vector-icons (Feather) | Thin line icons, bundled with Expo |
| expo-camera, expo-image-picker, expo-image-manipulator, expo-location | Pictures and place |
| react-native-svg | Charts and icons |

Every frontend stage ends with: screenshots on both platforms in light and dark, a Reduce Motion check, and a performance check against §7.3.

---

## 13. Decisions and open questions

### 13.1 Decided (2026-11-23)

| Topic | Decision |
| --- | --- |
| Tabs | Home, **Discover** (renamed from Image search), Analytics, Settings |
| Discover | Top: image search. Middle: daily challenges. Bottom: special challenges. Only image search is designed for now |
| Hamburger menu | Slide-out menu with Journal, Personal collection, My Habits, and settings shortcuts (light / dark theme) |
| Daily challenge card | One challenge a day, based on season and location; tapping it opens the challenge page |
| Challenge page | Image or collage, common names by region in different languages, short English description, bookmark top right |
| Bookmark | Animates and fills with the theme colour; saves the challenge; saved challenges are in Profile |
| Completing a challenge | Photographing the subject through image search; extra mana (amount later); not completing changes nothing; the photo joins the collection with date and time |
| Habits box | Own scroll box (your design); background matches the page; thin rules above and below each row |
| Scrollbar | Visible only while scrolling; fades smoothly into the background |
| Completing a habit | Tap the tick mark **or** the habit name: strike-through animation, text turns very light |
| Undo | Tap again, until 23:59 that day; after that the habit is recorded as incomplete |
| Completed habits | Stay where they are (sliding out may come later) |
| Edit / delete | Only in My Habits in the menu, never from the box |
| Greeting | Between the hamburger and the profile icon |
| Mana and level | Shown in Profile, not on Home |
| Steps and water tiles | Always shown on Home; non-negotiable. Words only ("Steps", "Water") until their phases |
| Water tile | Tapping it adds a glass; a + button next to the glass does the same |
| Week strip | Removed (the row of dates M 16 … S 22 at the top of the first mockup) |
| Dark theme | Ships in the first release, because the menu has a light / dark switch |

### 13.2 Questions still open from Home and challenges

- **H11. Fixed Home screen:** is my proposal in §9.2 acceptable, where Home itself does not scroll and only the habits box does?
- **H12. Unsave:** does tapping a filled bookmark again unsave the challenge?
- **H13. Saved challenges:** do they ever expire? Does completing a saved challenge later give the same extra mana?
- **H14. Challenge page button:** should the page have a "Take a picture" button that opens the Discover camera, or does the user go to Discover themselves?
- **H15. Languages:** which languages appear on the challenge page: those spoken in the user's region, a fixed list, or the user's choice? How many?
- **H16. Water mistakes:** can a glass be removed if tapped by accident (e.g. a − button or long-press)?
- **H17. Row rules:** is a 1.5 pt rule in `sand` the right weight? I will show it on screen in Phase 3 for your approval.
- **H18. Hint of more habits:** since the scrollbar is hidden at rest, should the bottom edge of the habits box softly fade out when more habits are below?
- **H19. Nature calendar:** where should it live? Suggested: inside Journal.

### 13.3 Still open from the first draft

**Look and feel**

1. **Typefaces:** DM Sans for UI with Literata for editorial text and italic scientific names, or DM Sans only?
2. **Sound:** soft sounds on ticks and reveals (§6.2)? On or off by default?
3. **Haptics:** on by default, with an off switch in settings?
4. ~~Dark theme in the first release?~~ Answered: yes (§13.1).
5. **Shadows:** is one very soft warm shadow on floating elements only (tab bar, capture button, sheets) acceptable (§3.3)?
6. **Seasonal tints:** should accent colours shift slightly with the season?
7. **Illustrations:** hand-drawn botanical line art, photography only, or none? Who provides the artwork?
8. **Signature moment:** is the specimen reveal the right one to spend boldness on, or would you choose the habit tick or the level-up?

**Motion and tools**

9. **Rive or Lottie?** I recommend **Rive**: smaller files and interactive state machines (a tick that reacts to the press). Lottie has a bigger free library of ready-made animations. Who will make these animations?
10. **Animation tools:** is the order in §6.4 acceptable? Mixing all three systems freely would give inconsistent easing.
11. **expo-image instead of FastImage:** agreed?

**Scope and devices**

12. **Minimum versions:** lowest iOS and Android versions to support? Which mid-range Android phone should be the performance reference?
13. **Tablets and landscape:** phone portrait only for the first release?
14. **Languages:** English only at first?
15. **Other screens:** will you sketch Profile, the slide-out menu, Discover, My Habits, Analytics and Settings as you did Home, or should I propose layouts as wireframes in this doc for your approval?
16. **Offline:** is the optimistic tick with an offline queue (§8) the behaviour you want?
17. **Onboarding:** are 3 short steps right, or do you want a longer welcome that sets the mood?

### 13.4 Choices made while building Phase 0 (to confirm)

| Choice | What was built | Easy to change? |
| --- | --- | --- |
| Typefaces | DM Sans for UI, Literata for editorial text and italic scientific names (only 6 weights shipped, 1.1 MB) | Yes |
| Icons | Feather line icons, bundled with Expo | Yes |
| Tab bar shadow | None, until you approve the soft shadow (§3.3) | Yes |
| Top bar | Menu, title and profile icon on every tab, so the menu is always one tap away | Yes |
| On-device storage | expo-sqlite key-value store instead of MMKV, so the app runs in Expo Go | Yes, behind an interface |
| Haptics | On, with no off switch yet | Yes |
| Press feedback | Native Gesture Handler `Touchable`, 80 ms in / 220 ms out, timed rather than spring (the native animation offers timing only) | Yes |
| Sounds | None yet | — |
| Design preview page | Settings → "Open design preview" (development builds only) | Removed before launch |
