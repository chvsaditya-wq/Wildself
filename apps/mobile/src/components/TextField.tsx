import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/design/theme';
import { minTouch, radius, space, type } from '@/design/tokens';

import { AppText } from './AppText';

type Props = Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'selectionColor' | 'cursorColor' | 'accessibilityLabel'
> & {
  label: string;
};

/**
 * Text field on the design tokens: a filled `sand` surface that turns `sageMist` while
 * focused (a tonal change, no outline or 1 px border, FRONTEND.md §1). Used inside a
 * `Screen scroll` or `KeyboardScrollView`, which keeps it above the keyboard (§7.4).
 */
export function TextField({ label, multiline, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.root}>
      <AppText variant="meta" tone="muted">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.lichen}
        selectionColor={colors.forest}
        cursorColor={colors.forest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          { backgroundColor: focused ? colors.sageMist : colors.sand, color: colors.bark },
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xs },
  input: {
    ...type.body,
    minHeight: minTouch + 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.photo,
  },
  multiline: { minHeight: 132, textAlignVertical: 'top' },
});
