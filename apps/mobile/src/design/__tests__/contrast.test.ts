import { contrastRatio } from '../contrast';
import { colors, type ColorScheme, type ColorTokens } from '../tokens';

/** Text-on-surface pairs the app actually uses. WCAG AA for normal text is 4.5:1. */
const TEXT_PAIRS: [keyof ColorTokens, keyof ColorTokens][] = [
  ['bark', 'paper'],
  ['bark', 'sand'],
  ['bark', 'sageMist'],
  ['lichen', 'paper'],
  ['lichen', 'sand'],
  ['forest', 'paper'],
  ['forest', 'sand'],
  ['forest', 'sageMist'],
  ['onForest', 'forest'],
  ['onForest', 'forestDeep'],
];

const schemes: ColorScheme[] = ['light', 'dark'];

describe.each(schemes)('%s palette', (scheme) => {
  const palette = colors[scheme];

  it.each(TEXT_PAIRS)('%s on %s reaches at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('never uses pure white or pure black', () => {
    const values = Object.values(palette).map((value) => value.toUpperCase());
    expect(values).not.toContain('#FFFFFF');
    expect(values).not.toContain('#000000');
  });
});

describe('contrastRatio', () => {
  it('matches the reference values for black and white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('rejects malformed colours', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});
