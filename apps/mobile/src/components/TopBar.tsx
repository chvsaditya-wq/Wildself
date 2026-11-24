import { router, useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design/theme';
import { minTouch, radius, space } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/**
 * Top row of every tab, from the hand sketch: menu on the left, a title or greeting
 * in between, profile on the right.
 */
export function TopBar({ title }: { title: string }) {
  const { colors } = useTheme();
  const drawer = useNavigation<DrawerNavigationProp<Record<string, object | undefined>>>('/(drawer)');

  return (
    <View style={styles.row}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={8}
        onPress={() => {
          haptics.select();
          drawer.openDrawer();
        }}
        style={styles.iconButton}
      >
        <Icon name="menu" color={colors.bark} />
      </PressableScale>

      <AppText variant="title" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
        onPress={() => {
          haptics.select();
          router.push('/profile');
        }}
        background={colors.sand}
        pressedBackground={colors.sageMist}
        style={[styles.iconButton, styles.avatar]}
      >
        <Icon name="user" color={colors.bark} size={22} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.xs,
    paddingBottom: space.xs,
  },
  iconButton: {
    width: minTouch,
    height: minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderRadius: radius.pill,
  },
  title: { flex: 1 },
});
