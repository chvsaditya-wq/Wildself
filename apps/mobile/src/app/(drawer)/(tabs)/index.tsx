import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { greetingFor } from '@/lib/greeting';

export default function HomeScreen() {
  return (
    <Screen>
      <TopBar title={greetingFor(new Date())} />
      <EmptyState
        title="Your day outside starts here"
        body="Phase 3 builds Home from your sketch: today's challenge, the Steps and Water tiles, and your habits to tick off."
      />
    </Screen>
  );
}
