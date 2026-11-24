import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design/theme';
import { gutter, space } from '@/design/tokens';

/** Room left at the bottom so content never hides behind the floating tab bar. */
export const TAB_BAR_CLEARANCE = 112;

/** Page container: paper background, safe area at the top, 24 pt side margins. */
export function Screen({
  children,
  scroll = false,
  withTabBar = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  withTabBar?: boolean;
}) {
  const { colors } = useTheme();
  const bottom = withTabBar ? TAB_BAR_CLEARANCE : space.lg;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.paper }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, { paddingBottom: bottom }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: gutter, gap: space.md },
});
