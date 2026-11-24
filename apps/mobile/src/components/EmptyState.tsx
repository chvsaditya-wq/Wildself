import { StyleSheet, View } from 'react-native';

import { space } from '@/design/tokens';

import { AppText } from './AppText';
import { Card } from './Card';

/** A calm placeholder that says what will live here and invites the next step. */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card tint="sageMist" style={styles.card}>
      <View style={styles.stack}>
        <AppText variant="editorialTitle">{title}</AppText>
        <AppText tone="muted">{body}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: space.xs },
  stack: { gap: space.xs },
});
