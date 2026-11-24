import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/design/theme';
import { type, type TextVariant } from '@/design/tokens';

export type TextTone = 'primary' | 'muted' | 'accent' | 'onAccent';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  /** Scientific names: Literata italic (FRONTEND.md §4). */
  scientific?: boolean;
};

/** All text in the app goes through this, so type and colour always come from the tokens. */
export function AppText({ variant = 'body', tone = 'primary', scientific, style, ...rest }: Props) {
  const { colors } = useTheme();
  const color = {
    primary: colors.bark,
    muted: colors.lichen,
    accent: colors.forest,
    onAccent: colors.onForest,
  }[tone];

  return (
    <Text
      {...rest}
      style={[
        type[variant],
        { color },
        scientific ? { fontFamily: 'Literata_400Regular_Italic' } : null,
        style,
      ]}
    />
  );
}
