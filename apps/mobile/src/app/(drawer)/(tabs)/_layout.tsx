import { useDrawerProgress } from 'expo-router/drawer';
import { Tabs, type BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { Easing, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/design/theme';
import { motion } from '@/design/tokens';

/** Cross-fade with an 8 pt drift between tabs (FRONTEND.md §6.3). */
const fadeAndDrift: BottomTabNavigationOptions['sceneStyleInterpolator'] = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [
      {
        translateY: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [8, 0, 8] }),
      },
    ],
  },
});

const fadeOnly: BottomTabNavigationOptions['sceneStyleInterpolator'] = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
  },
});

export default function TabsLayout() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const drawerProgress = useDrawerProgress();

  // While the menu opens, the page drifts 24 pt right under the dimmed overlay.
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reduceMotion ? 0 : drawerProgress.get() * motion.menuDrift }],
  }));

  return (
    <Animated.View style={[styles.fill, { backgroundColor: colors.paper }, driftStyle]}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          sceneStyleInterpolator: reduceMotion ? fadeOnly : fadeAndDrift,
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: motion.tabFade.duration,
              easing: Easing.bezier(...motion.drift.bezier),
            },
          },
          sceneStyle: { backgroundColor: colors.paper },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Icon name="home" color={String(color)} size={size} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => <Icon name="compass" color={String(color)} size={size} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Icon name="bar-chart-2" color={String(color)} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Icon name="settings" color={String(color)} size={size} />,
          }}
        />
      </Tabs>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
