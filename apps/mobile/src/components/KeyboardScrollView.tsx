import { Platform } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

import { space } from '@/design/tokens';

/**
 * Space kept between a focused text field (or the end of the content) and the top of
 * the keyboard (FRONTEND.md §7.4).
 */
export const KEYBOARD_GAP = space.lg;

/** iOS: drag the keyboard down with the content. Android: dismiss as soon as the list is dragged. */
const DISMISS_MODE = Platform.OS === 'ios' ? 'interactive' : 'on-drag';

/**
 * The only scroll view the app uses (FRONTEND.md §7.4, non-negotiable).
 *
 * - **Keyboard avoidance:** when a field gains focus, it is scrolled to sit `KEYBOARD_GAP`
 *   above the keyboard, frame by frame with the keyboard's own animation.
 * - **Inset adjustments:** the keyboard's height is added as a bottom content inset (and to
 *   the scroll indicator), not as layout, so nothing reflows while the keyboard moves. iOS's
 *   own automatic safe-area and keyboard insets are switched off so they can't add twice.
 * - **Taps:** a tap on a button works while the keyboard is open; a tap on empty space or a
 *   drag closes the keyboard.
 */
export function KeyboardScrollView(props: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={KEYBOARD_GAP}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={DISMISS_MODE}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustKeyboardInsets={false}
      {...props}
    />
  );
}
