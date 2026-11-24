import { randomUUID } from 'expo-crypto';

import { OfflineQueue } from './offline-queue';
import { deviceStore } from './storage';

/** The app's single offline queue. Senders are added in Phase 3, when the first actions exist. */
export const actionQueue = new OfflineQueue({ store: deviceStore, newId: randomUUID });
