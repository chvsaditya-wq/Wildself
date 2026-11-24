import { useTheme, type ThemePreference } from '@/design/theme';

import { SegmentedControl, type SegmentOption } from './SegmentedControl';

const OPTIONS: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: 'System', icon: 'smartphone' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

/** Light / dark switch: the same control in the menu and in Settings. */
export function ThemeSwitch() {
  const { preference, setPreference } = useTheme();
  return (
    <SegmentedControl
      accessibilityLabel="Appearance"
      options={OPTIONS}
      value={preference}
      onChange={setPreference}
    />
  );
}
