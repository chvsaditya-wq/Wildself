/**
 * Design tokens. Source of truth: docs/FRONTEND.md §3–6.
 * Never use pure white (#FFFFFF) or pure black (#000000) anywhere in the app.
 */

export type ColorScheme = 'light' | 'dark';

export type ColorTokens = {
  /** Screen background. */
  paper: string;
  /** Cards, day chips, tab bar. */
  sand: string;
  /** Highlighted surfaces, active tab indicator, secondary buttons. */
  sageMist: string;
  /** Primary actions, selected states, checkmarks. */
  forest: string;
  /** Pressed state of forest. */
  forestDeep: string;
  /** Text and icons on a forest surface. */
  onForest: string;
  /** Headings and body text. */
  bark: string;
  /** Secondary text. */
  lichen: string;
  /** Progress fills, streak marks, scrollbars. */
  moss: string;
  /** Water. */
  lake: string;
  /** Level-ups and rewards, used rarely. */
  pollen: string;
  /** Thin rules between habit rows (the one allowed rule, FRONTEND.md §1 rule 8). */
  rule: string;
  /** Dim layer behind sheets and the slide-out menu. */
  scrim: string;
};

export const colors: Record<ColorScheme, ColorTokens> = {
  light: {
    paper: '#F5F2EB',
    sand: '#E8E1D5',
    sageMist: '#DFE7DA',
    forest: '#2E6B4F',
    forestDeep: '#24563F',
    onForest: '#F5F2EB',
    bark: '#4E3F33',
    lichen: '#6B5D51',
    moss: '#8FA67A',
    lake: '#5E8A9A',
    pollen: '#C9A24B',
    rule: '#E8E1D5',
    scrim: 'rgba(78, 63, 51, 0.30)',
  },
  dark: {
    paper: '#1F2420',
    sand: '#2A302B',
    sageMist: '#2F3A31',
    forest: '#7FB596',
    forestDeep: '#6A9F81',
    onForest: '#1F2420',
    bark: '#EDE6DA',
    lichen: '#B5AA9C',
    moss: '#7E9A6A',
    lake: '#7FA9B8',
    pollen: '#D4B266',
    rule: '#2A302B',
    scrim: 'rgba(12, 14, 12, 0.45)',
  },
};

/** 8 px rhythm with a 4 px half step. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

/** Radius follows the role of the element (FRONTEND.md §5). */
export const radius = {
  photo: 20,
  card: 28,
  sheet: 36,
  pill: 999,
} as const;

/** Screen side margin. */
export const gutter = space.lg;

/** Minimum touch target, in points. */
export const minTouch = 48;

export const fontFamily = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  serif: 'Literata_400Regular',
  serifMedium: 'Literata_500Medium',
  serifItalic: 'Literata_400Regular_Italic',
} as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'editorialTitle'
  | 'body'
  | 'journal'
  | 'meta'
  | 'label';

export const type: Record<
  TextVariant,
  { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }
> = {
  display: { fontFamily: fontFamily.sans, fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontFamily: fontFamily.sansMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  editorialTitle: { fontFamily: fontFamily.serifMedium, fontSize: 26, lineHeight: 32 },
  body: { fontFamily: fontFamily.sans, fontSize: 16, lineHeight: 24 },
  journal: { fontFamily: fontFamily.serif, fontSize: 17, lineHeight: 27 },
  meta: { fontFamily: fontFamily.sansMedium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.sansMedium, fontSize: 12, lineHeight: 16 },
};

/** Motion tokens (FRONTEND.md §6.1). Springs run on the UI thread via Reanimated. */
export const motion = {
  press: { damping: 20, stiffness: 400, mass: 1 },
  /** Native press animation timings (ms): quick in, gentle out. */
  pressTiming: { in: 80, out: 220 },
  settle: { damping: 18, stiffness: 180, mass: 1 },
  drift: { duration: 420, bezier: [0.22, 1, 0.36, 1] as const },
  tabFade: { duration: 220 },
  pulse: { duration: 1200, from: 0.45, to: 0.8 },
  pressScale: 0.97,
  /** Content drift while the slide-out menu is open. */
  menuDrift: 24,
} as const;
