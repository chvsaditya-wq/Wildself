import { OfflineQueue, type QueuedAction, type SendOutcome } from '../offline-queue';
import { createMemoryStore } from '../storage';

function setup(start = '2026-11-23T23:50:00.000Z') {
  const store = createMemoryStore();
  let n = 0;
  let clock = new Date(start);
  const queue = new OfflineQueue({
    store,
    newId: () => `id-${++n}`,
    now: () => clock,
  });
  return {
    store,
    queue,
    setClock: (iso: string) => {
      clock = new Date(iso);
    },
  };
}

describe('OfflineQueue', () => {
  it('stores an action with its own id and the moment it happened', () => {
    const { queue } = setup();
    const action = queue.enqueue('habit.tick', { habitId: 'h1', localDate: '2026-11-23' });

    expect(action).toEqual({
      clientActionId: 'id-1',
      type: 'habit.tick',
      payload: { habitId: 'h1', localDate: '2026-11-23' },
      deviceOccurredAt: '2026-11-23T23:50:00.000Z',
      attempts: 0,
    });
    expect(queue.size()).toBe(1);
  });

  it('survives an app restart (a new queue on the same store sees the actions)', () => {
    const { store, queue } = setup();
    queue.enqueue('habit.tick', { habitId: 'h1' });
    const reopened = new OfflineQueue({ store, newId: () => 'x' });
    expect(reopened.pending().map((a) => a.clientActionId)).toEqual(['id-1']);
  });

  it('sends oldest first and sends the phone clock at the moment of sending', async () => {
    const { queue, setClock } = setup();
    queue.enqueue('habit.tick', { habitId: 'h1' });
    queue.enqueue('water.add', {});
    setClock('2026-11-24T08:00:00.000Z');

    const calls: [string, string][] = [];
    const result = await queue.flush(async (action, deviceSentAt) => {
      calls.push([action.clientActionId, deviceSentAt]);
      return 'sent';
    });

    expect(calls).toEqual([
      ['id-1', '2026-11-24T08:00:00.000Z'],
      ['id-2', '2026-11-24T08:00:00.000Z'],
    ]);
    expect(result.sent.map((a) => a.clientActionId)).toEqual(['id-1', 'id-2']);
    expect(result.remaining).toBe(0);
    expect(queue.size()).toBe(0);
  });

  it('keeps the original time of an offline tick, however late it is sent', async () => {
    const { queue, setClock } = setup('2026-11-23T23:50:00.000Z');
    queue.enqueue('habit.tick', { habitId: 'h1' });
    setClock('2026-11-25T09:00:00.000Z');

    let seen: QueuedAction | undefined;
    await queue.flush(async (action) => {
      seen = action;
      return 'sent';
    });
    expect(seen?.deviceOccurredAt).toBe('2026-11-23T23:50:00.000Z');
  });

  it('stops at the first action that cannot be sent yet, keeping order', async () => {
    const { queue } = setup();
    queue.enqueue('a', {});
    queue.enqueue('b', {});
    queue.enqueue('c', {});

    const outcomes: SendOutcome[] = ['sent', 'retry-later', 'sent'];
    const result = await queue.flush(async () => outcomes.shift() ?? 'sent');

    expect(result.sent.map((a) => a.type)).toEqual(['a']);
    expect(result.remaining).toBe(2);
    expect(queue.pending().map((a) => a.type)).toEqual(['b', 'c']);
    expect(queue.pending()[0]?.attempts).toBe(1);
  });

  it('treats a thrown error (e.g. no network) as "try later"', async () => {
    const { queue } = setup();
    queue.enqueue('a', {});
    const result = await queue.flush(async () => {
      throw new Error('Network request failed');
    });
    expect(result.remaining).toBe(1);
    expect(queue.pending()[0]?.attempts).toBe(1);
  });

  it('removes and reports actions the server refuses for good, then carries on', async () => {
    const { queue } = setup();
    queue.enqueue('bad', {});
    queue.enqueue('good', {});

    const result = await queue.flush(async (action) =>
      action.type === 'bad' ? 'rejected' : 'sent',
    );
    expect(result.rejected.map((a) => a.type)).toEqual(['bad']);
    expect(result.sent.map((a) => a.type)).toEqual(['good']);
    expect(queue.size()).toBe(0);
  });

  it('runs one flush at a time: overlapping calls share it and nothing is sent twice', async () => {
    const { queue } = setup();
    queue.enqueue('a', {});
    queue.enqueue('b', {});

    const sentIds: string[] = [];
    const send = async (action: QueuedAction): Promise<SendOutcome> => {
      sentIds.push(action.clientActionId);
      await new Promise((resolve) => setTimeout(resolve, 5));
      return 'sent';
    };

    const [first, second] = await Promise.all([queue.flush(send), queue.flush(send)]);
    expect(sentIds).toEqual(['id-1', 'id-2']);
    expect(first).toBe(second);
  });

  it('keeps actions added while a flush is running', async () => {
    const { queue } = setup();
    queue.enqueue('a', {});

    const result = await queue.flush(async (action) => {
      if (action.type === 'a') queue.enqueue('added-during-send', {});
      return 'sent';
    });

    expect(result.sent.map((a) => a.type)).toEqual(['a', 'added-during-send']);
    expect(queue.size()).toBe(0);
  });

  it('ignores corrupted stored data instead of crashing', () => {
    const store = createMemoryStore({ 'offline-queue': '{not json' });
    const queue = new OfflineQueue({ store, newId: () => 'id' });
    expect(queue.size()).toBe(0);
  });
});
