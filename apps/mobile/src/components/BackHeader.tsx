import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design/theme';
import { minTouch, space } from '@/design/tokens';
import { haptics } from '@/motion/haptics';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/** Header for pushed pages (menu items, profile): back on the left, title beside it. */
export function BackHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        onPress={() => {
          haptics.select();
          router.back();
        }}
        style={styles.back}
      >
        <Icon name="chevron-left" size={28} color={colors.bark} />
      </PressableScale>
      <AppText variant="title" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.xs },
  back: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center', marginLeft: -space.sm },
  title: { flex: 1 },
});
