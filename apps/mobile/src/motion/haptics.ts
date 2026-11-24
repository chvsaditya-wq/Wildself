import * as Haptics from 'expo-haptics';

/**
 * Haptic vocabulary (FRONTEND.md §6.2). Failures are ignored: haptics are a nicety,
 * never a reason for an interaction to fail.
 */
export const haptics = {
  /** Tick a habit, tap the bookmark, add a glass. */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  /** Switch tab, change a segmented choice, open the menu, untick. */
  select: () => {
    Haptics.selectionAsync().catch(() => undefined);
  },
  /** Last habit of the day, specimen reveal, level-up. */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
};
