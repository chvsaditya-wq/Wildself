import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppThemeProvider } from '@/design/theme';
import { createMemoryStore, type KeyValueStore } from '@/lib/storage';

import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import { KEYBOARD_GAP } from '../KeyboardScrollView';
import { Screen, TAB_BAR_CLEARANCE } from '../Screen';
import { TextField } from '../TextField';
import { ThemeSwitch } from '../ThemeSwitch';

jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-sqlite/kv-store', () => ({
  getItemSync: jest.fn(() => null),
  setItemSync: jest.fn(),
  removeItemSync: jest.fn(),
}));

function withTheme(ui: ReactNode, store: KeyValueStore = createMemoryStore()) {
  return render(<AppThemeProvider store={store}>{ui}</AppThemeProvider>);
}

describe('Button', () => {
  it('is announced as a button and calls onPress', async () => {
    const onPress = jest.fn();
    await withTheme(<Button label="Save habit" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save habit' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ThemeSwitch', () => {
  it('starts on System and remembers a new choice on the phone', async () => {
    const store = createMemoryStore();
    await withTheme(<ThemeSwitch />, store);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(store.getItem('theme-preference')).toBe('dark');
  });

  it('restores the saved choice when the app opens again', async () => {
    await withTheme(<ThemeSwitch />, createMemoryStore({ 'theme-preference': 'light' }));
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });
});

describe('Screen keyboard handling (FRONTEND.md §7.4)', () => {
  it('scroll pages keep the focused field above the keyboard and let taps through', async () => {
    await withTheme(
      <Screen scroll>
        <TextField label="Habit name" />
      </Screen>,
    );
    const scroll = screen.getByTestId('screen-scroll');
    expect(scroll.props.bottomOffset).toBe(KEYBOARD_GAP);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.keyboardDismissMode).toBeDefined();
    // iOS's own insets are off, so the keyboard inset is never added twice.
    expect(scroll.props.contentInsetAdjustmentBehavior).toBe('never');
    expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(false);
  });

  it('fixed pages avoid the keyboard without adding the tab-bar clearance on top', async () => {
    await withTheme(
      <Screen>
        <TextField label="Habit name" />
      </Screen>,
    );
    const fixed = screen.getByTestId('screen-fixed');
    expect(fixed.props.behavior).toBe('padding');
    expect(fixed.props.automaticOffset).toBe(true);
    expect(fixed.props.keyboardVerticalOffset).toBe(KEYBOARD_GAP - TAB_BAR_CLEARANCE);
  });
});

describe('TextField', () => {
  it('is labelled for screen readers and changes tone while focused', async () => {
    const onFocus = jest.fn();
    await withTheme(<TextField label="Habit name" placeholder="Morning walk" onFocus={onFocus} />);
    const background = () =>
      [screen.getByLabelText('Habit name').props.style]
        .flat(3)
        .reverse()
        .find((s) => s?.backgroundColor)?.backgroundColor;

    const before = background();
    await fireEvent(screen.getByLabelText('Habit name'), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(background()).not.toBe(before);
  });
});

describe('EmptyState', () => {
  it('shows its title and body', async () => {
    await withTheme(<EmptyState title="Nothing collected yet" body="Your first find goes here." />);
    expect(screen.getByText('Nothing collected yet')).toBeOnTheScreen();
    expect(screen.getByText('Your first find goes here.')).toBeOnTheScreen();
  });
});
