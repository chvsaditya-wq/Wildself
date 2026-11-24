import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { TopBar } from '@/components/TopBar';
import { space } from '@/design/tokens';

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <TopBar title="Settings" />

      <View style={styles.section}>
        <AppText variant="meta" tone="muted">
          Appearance
        </AppText>
        <ThemeSwitch />
      </View>

      {__DEV__ ? (
        <View style={styles.section}>
          <AppText variant="meta" tone="muted">
            For review during development
          </AppText>
          <Button
            variant="secondary"
            label="Open design preview"
            onPress={() => router.push('/design')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm, marginTop: space.xs },
});
