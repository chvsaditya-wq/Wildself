import { StyleSheet } from 'react-native';

import { useTheme } from '@/design/theme';
import { minTouch, radius, space } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

/**
 * Primary: solid forest pill with paper text, deepens when pressed.
 * Secondary: sage-mist pill with forest text.
 */
export function Button({ label, variant = 'primary', onPress, disabled, accessibilityHint }: Props) {
  const { colors } = useTheme();
  const primary = variant === 'primary';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      background={primary ? colors.forest : colors.sageMist}
      pressedBackground={primary ? colors.forestDeep : colors.sand}
      style={styles.base}
    >
      <AppText variant="body" tone={primary ? 'onAccent' : 'accent'} style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch + 8,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 17,
  },
});
