import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { KeyboardScrollView } from '@/components/KeyboardScrollView';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { useTheme } from '@/design/theme';
import { gutter, radius, space, type ColorTokens } from '@/design/tokens';

/** Development-only page for reviewing the Phase 0 building blocks in light and dark. */
export default function DesignPreviewScreen() {
  const { colors } = useTheme();
  const swatches: (keyof ColorTokens)[] = [
    'paper', 'sand', 'sageMist', 'forest', 'bark', 'lichen', 'moss', 'lake', 'pollen',
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.paper }]}>
      <KeyboardScrollView contentContainerStyle={styles.content}>
        <BackHeader title="Design preview" />

        <Section title="Appearance">
          <ThemeSwitch />
        </Section>

        <Section title="Type">
          <AppText variant="display">Good morning</AppText>
          <AppText variant="title">Step outside</AppText>
          <AppText variant="editorialTitle">Common kingfisher</AppText>
          <AppText variant="journal" scientific>
            Alcedo atthis
          </AppText>
          <AppText>A screen-free walk in the park.</AppText>
          <AppText variant="journal">
            The light on the water was the first thing I noticed this morning.
          </AppText>
          <AppText variant="meta" tone="accent">
            15 min · Outdoors
          </AppText>
        </Section>

        <Section title="Colour">
          <View style={styles.swatches}>
            {swatches.map((name) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.chip, { backgroundColor: colors[name] }]} />
                <AppText variant="label" tone="muted">
                  {name}
                </AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Buttons">
          <Button label="Save habit" />
          <Button label="Not now" variant="secondary" />
        </Section>

        <Section title="Cards">
          <Card>
            <AppText variant="title">Breathe by the water</AppText>
            <AppText tone="muted">Let your mind settle with the ripples</AppText>
          </Card>
          <Card tint="sageMist">
            <AppText variant="title">Spot a local kingfisher near water</AppText>
          </Card>
        </Section>

        <Section title="Loading">
          <Skeleton height={120} />
          <View style={styles.row}>
            <View style={styles.half}>
              <Skeleton height={88} />
            </View>
            <View style={styles.half}>
              <Skeleton height={88} />
            </View>
          </View>
          <Skeleton height={20} width="60%" rounded={radius.pill} />
        </Section>

        <Section title="Empty">
          <EmptyState
            title="Nothing collected yet"
            body="The next leaf, bird or bloom you notice can be your first."
          />
        </Section>

        {/* Last on the page on purpose: the keyboard would cover these fields without §7.4. */}
        <Section title="Text fields · keyboard check">
          <TextField label="Habit name" placeholder="Morning walk" returnKeyType="next" />
          <TextField label="Where" placeholder="The park by the river" returnKeyType="next" />
          <TextField
            label="Journal"
            placeholder="What did you notice today? Keep typing past a few lines."
            multiline
          />
        </Section>
      </KeyboardScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="meta" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingBottom: space.xxxl, gap: space.xl },
  section: { gap: space.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatch: { alignItems: 'center', gap: space.xxs, width: 64 },
  chip: { width: 48, height: 48, borderRadius: radius.pill },
  row: { flexDirection: 'row', gap: space.sm },
  half: { flex: 1 },
});
