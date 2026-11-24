import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design/theme';
import { minTouch, motion, radius } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

const PADDING = 4;

export type SegmentOption<T extends string> = { value: T; label: string; icon?: IconName };

/** A row of choices with a gliding sage indicator (used for the theme switch). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const itemWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;

  const position = useSharedValue(selectedIndex);
  // Start the glide on the tap itself; the effect only follows changes made elsewhere.
  const target = useRef(selectedIndex);

  const glideTo = (index: number) => {
    target.current = index;
    position.set(
      reduceMotion ? withTiming(index, { duration: 0 }) : withSpring(index, motion.settle),
    );
  };

  useEffect(() => {
    if (target.current !== selectedIndex) glideTo(selectedIndex);
  });

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: position.get() * itemWidth }],
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.sand }]}
    >
      {itemWidth > 0 ? (
        <Animated.View style={[styles.indicator, { backgroundColor: colors.sageMist }, indicatorStyle]} />
      ) : null}
      {options.map((option, index) => {
        const selected = option.value === value;
        const color = selected ? colors.forest : colors.lichen;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (!selected) {
                glideTo(index);
                haptics.select();
                onChange(option.value);
              }
            }}
            style={[styles.item, { width: itemWidth || undefined }]}
          >
            {option.icon ? <Icon name={option.icon} size={16} color={color} /> : null}
            <AppText variant="meta" style={{ color }}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.pill,
  },
  item: {
    minHeight: minTouch - 4,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
