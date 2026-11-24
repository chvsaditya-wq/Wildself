import { Drawer } from 'expo-router/drawer';

import { MenuContent } from '@/components/MenuContent';
import { useTheme } from '@/design/theme';

/** Slide-out menu (hamburger, top left). Holds the tab navigator as its only screen. */
export default function DrawerLayout() {
  const { colors } = useTheme();
  return (
    <Drawer
      drawerContent={(props) => <MenuContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: colors.scrim,
        drawerStyle: { backgroundColor: colors.paper, width: 300 },
        swipeEdgeWidth: 32,
      }}
    >
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
