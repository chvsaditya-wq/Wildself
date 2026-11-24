import { router, type Href } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design/theme';
import { gutter, minTouch, radius, space } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { ThemeSwitch } from './ThemeSwitch';

type MenuItem = { label: string; icon: IconName; href: Href };

/** Slide-out menu contents (FRONTEND.md §9.1). */
const ITEMS: MenuItem[] = [
  { label: 'Journal', icon: 'book-open', href: '/journal' },
  { label: 'Personal collection', icon: 'grid', href: '/collection' },
  { label: 'My Habits', icon: 'list', href: '/my-habits' },
];

export function MenuContent({ navigation }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const go = (href: Href) => {
    haptics.select();
    navigation.closeDrawer();
    router.push(href);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg },
      ]}
    >
      <AppText variant="editorialTitle">Wildself</AppText>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <PressableScale
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => go(item.href)}
            background={colors.paper}
            pressedBackground={colors.sand}
            style={styles.item}
          >
            <Icon name={item.icon} color={colors.forest} />
            <AppText>{item.label}</AppText>
          </PressableScale>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="meta" tone="muted">
          Appearance
        </AppText>
        <ThemeSwitch />
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => go('/settings')}
        background={colors.paper}
        pressedBackground={colors.sand}
        style={styles.item}
      >
        <Icon name="settings" color={colors.lichen} />
        <AppText tone="muted">Settings</AppText>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, gap: space.xl },
  list: { gap: space.xxs },
  item: {
    minHeight: minTouch + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
  section: { gap: space.sm },
});
