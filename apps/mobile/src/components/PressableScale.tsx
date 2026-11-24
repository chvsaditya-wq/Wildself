import type { ReactNode } from 'react';
import type { AccessibilityProps, Insets, StyleProp, ViewStyle } from 'react-native';
import { Touchable } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { motion } from '@/design/tokens';

type Props = AccessibilityProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hitSlop?: number | Insets;
  testID?: string;
  /** Resting background colour. */
  background?: string;
  /** Background while pressed: one tone deeper (FRONTEND.md §6.2). */
  pressedBackground?: string;
  /** How far the element shrinks while pressed. */
  scaleTo?: number;
};

/**
 * The press feel used by every tappable element: shrinks to 0.97 and deepens one tone,
 * then eases back.
 *
 * Built on Gesture Handler's native `Touchable`: the touch is recognised and the press
 * animation is run entirely by the platform, so the feedback starts on the very next
 * frame and never waits for JavaScript (FRONTEND.md §7: 120 fps rule).
 * With Reduce Motion on, only the tone changes.
 */
export function PressableScale({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  hitSlop,
  background,
  pressedBackground,
  scaleTo = motion.pressScale,
  ...accessibility
}: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <Touchable
      // One focusable element for screen readers, label and all.
      accessible
      {...accessibility}
      onPress={onPress ? () => onPress() : undefined}
      onLongPress={onLongPress ? () => onLongPress() : undefined}
      disabled={disabled}
      hitSlop={hitSlop}
      defaultScale={1}
      activeScale={reduceMotion ? 1 : scaleTo}
      underlayColor={pressedBackground}
      defaultUnderlayOpacity={0}
      activeUnderlayOpacity={pressedBackground ? 1 : 0}
      animationDuration={{ in: motion.pressTiming.in, out: motion.pressTiming.out }}
      style={[background ? { backgroundColor: background } : null, style]}
    >
      {children}
    </Touchable>
  );
}
