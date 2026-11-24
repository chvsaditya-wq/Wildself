import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design/theme';
import { motion, radius } from '@/design/tokens';

/**
 * Loading placeholder: a plain sand block whose opacity pulses on the UI thread.
 * No SVG masks, no shimmer package, no spinner (FRONTEND.md §7.1).
 */
export function Skeleton({
  width = '100%',
  height,
  rounded = radius.card,
}: {
  width?: DimensionValue;
  height: number;
  rounded?: number;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue<number>(motion.pulse.from);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.set(
      withRepeat(
        withTiming(motion.pulse.to, {
          duration: motion.pulse.duration / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    );
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.sand }, style]}
    />
  );
}
