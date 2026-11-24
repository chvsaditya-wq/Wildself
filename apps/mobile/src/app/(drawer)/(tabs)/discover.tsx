import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';

export default function DiscoverScreen() {
  return (
    <Screen>
      <TopBar title="Discover" />
      <EmptyState
        title="Take a closer look"
        body="Phase 9 adds image search: photograph a leaf, bird or bloom and learn what it is. Daily and special challenges follow in Phases 11 and 15."
      />
    </Screen>
  );
}
