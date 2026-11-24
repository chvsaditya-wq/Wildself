import type { BottomTabBarProps } from 'expo-router/js-tabs';
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
import { gutter, minTouch, motion, radius, space } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const BAR_PADDING = space.xs;

/**
 * Floating pill tab bar from the mockup. A sage indicator glides to the active tab
 * on a spring; a light selection haptic marks each change.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [barWidth, setBarWidth] = useState(0);

  const count = state.routes.length;
  const itemWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / count : 0;

  const position = useSharedValue(state.index);
  // The index the indicator is already heading to. A tap starts the glide immediately,
  // before React re-renders the new tab; the effect only catches changes made elsewhere
  // (e.g. opening Settings from the menu), so a running spring is never restarted.
  const target = useRef(state.index);

  const glideTo = (index: number) => {
    target.current = index;
    position.set(
      reduceMotion ? withTiming(index, { duration: 0 }) : withSpring(index, motion.settle),
    );
  };

  useEffect(() => {
    if (target.current !== state.index) glideTo(state.index);
  });

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: position.get() * itemWidth }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}
    >
      <View
        accessibilityRole="tablist"
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={[styles.bar, { backgroundColor: colors.sand }]}
      >
        {itemWidth > 0 ? (
          <Animated.View
            style={[styles.indicator, { backgroundColor: colors.sageMist }, indicatorStyle]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const focused = index === state.index;
          const color = focused ? colors.forest : colors.lichen;
          const label = options.title ?? route.name;

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  glideTo(index);
                  haptics.select();
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={[styles.item, { width: itemWidth || undefined }]}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <AppText
                variant="label"
                style={[styles.label, { color }, focused ? styles.labelFocused : null]}
              >
                {label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: gutter,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: BAR_PADDING,
  },
  indicator: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: radius.pill,
  },
  item: {
    minHeight: minTouch + 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.pill,
  },
  label: { textAlign: 'center' },
  labelFocused: { fontFamily: 'DMSans_600SemiBold' },
});
