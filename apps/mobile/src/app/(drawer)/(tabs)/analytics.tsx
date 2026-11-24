import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';

export default function AnalyticsScreen() {
  return (
    <Screen>
      <TopBar title="Analytics" />
      <EmptyState
        title="Your field notes"
        body="Phase 12 fills this page with how your habits, walks, water and discoveries add up over weeks and months."
      />
    </Screen>
  );
}
