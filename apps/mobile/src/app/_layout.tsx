// Import each weight on its own: the packages' main entry pulls in every weight
// (about 5 MB), which would break the "light app" rule.
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { Literata_400Regular } from '@expo-google-fonts/literata/400Regular';
import { Literata_400Regular_Italic } from '@expo-google-fonts/literata/400Regular_Italic';
import { Literata_500Medium } from '@expo-google-fonts/literata/500Medium';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppThemeProvider, useTheme } from '@/design/theme';
import { colors as palette, gutter, radius, space } from '@/design/tokens';

// Keep the splash screen up until the fonts are ready, so text never flashes or jumps.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Literata_400Regular,
    Literata_500Medium,
    Literata_400Regular_Italic,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hide();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.fill}>
      {/* Tracks the keyboard frame by frame on the UI thread for every screen (FRONTEND.md §7.4). */}
      <KeyboardProvider>
        <AppThemeProvider>
          <Navigation />
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.paper,
      card: colors.paper,
      text: colors.bark,
      primary: colors.forest,
      border: colors.sand,
      notification: colors.moss,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="collection" />
        <Stack.Screen name="my-habits" />
        <Stack.Screen name="design" />
      </Stack>
    </ThemeProvider>
  );
}

/**
 * Shown if a screen crashes. Plain React Native only, so it still works if the theme
 * or fonts are what failed. Says what happened and offers one way forward.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = palette[scheme];
  return (
    <View style={[styles.error, { backgroundColor: c.paper }]}>
      <Text style={[styles.errorTitle, { color: c.bark }]}>This page stopped working.</Text>
      <Text style={[styles.errorBody, { color: c.lichen }]}>
        Your habits and progress are safe. Try opening it again.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          retry().catch(() => undefined);
        }}
        style={[styles.errorButton, { backgroundColor: c.forest }]}
      >
        <Text style={[styles.errorButtonLabel, { color: c.onForest }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: gutter, gap: space.md },
  errorTitle: { fontSize: 22, lineHeight: 28 },
  errorBody: { fontSize: 16, lineHeight: 24 },
  errorButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  errorButtonLabel: { fontSize: 17 },
});
