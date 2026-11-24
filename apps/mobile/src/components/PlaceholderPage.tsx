import { BackHeader } from './BackHeader';
import { EmptyState } from './EmptyState';
import { Screen } from './Screen';

/** A pushed page that exists in the shell but is built in a later phase. */
export function PlaceholderPage({
  title,
  heading,
  body,
}: {
  title: string;
  heading: string;
  body: string;
}) {
  return (
    <Screen withTabBar={false}>
      <BackHeader title={title} />
      <EmptyState title={heading} body={body} />
    </Screen>
  );
}
