import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';

/** A sand surface. Separated from the page by tone only: no border, no shadow. */
export function Card({
  children,
  tint = 'sand',
  style,
}: {
  children: ReactNode;
  tint?: 'sand' | 'sageMist';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors[tint], borderRadius: radius.card, padding: space.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}
