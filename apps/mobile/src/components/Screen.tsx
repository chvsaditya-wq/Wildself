import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design/theme';
import { gutter, space } from '@/design/tokens';

import { KEYBOARD_GAP, KeyboardScrollView } from './KeyboardScrollView';

/** Room left at the bottom so content never hides behind the floating tab bar. */
export const TAB_BAR_CLEARANCE = 112;

/**
 * Page container: paper background, safe area at the top, 24 pt side margins.
 * Every page avoids the keyboard (FRONTEND.md §7.4, non-negotiable):
 *
 * - `scroll` pages use `KeyboardScrollView`: the focused field is scrolled above the keyboard
 *   and the keyboard's height becomes a content inset. Pages with text fields use this mode.
 * - Fixed pages use `KeyboardAvoidingView`: the content area shrinks by the keyboard's height,
 *   animated on the UI thread. The offset removes the bottom clearance (kept for the tab bar,
 *   which the keyboard covers), so the content ends `KEYBOARD_GAP` above the keyboard.
 */
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
        <KeyboardScrollView
          testID="screen-scroll"
          contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardScrollView>
      ) : (
        <KeyboardAvoidingView
          testID="screen-fixed"
          behavior="padding"
          automaticOffset
          keyboardVerticalOffset={KEYBOARD_GAP - bottom}
          style={styles.fill}
        >
          <View style={[styles.content, styles.fill, { paddingBottom: bottom }]}>{children}</View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: gutter, gap: space.md },
});
