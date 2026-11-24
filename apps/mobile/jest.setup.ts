import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';

// Gesture Handler's native UI-runtime hook-up is replaced in tests through
// `moduleNameMapper` in package.json (a jest.mock here misses it on Windows,
// where the same file can be loaded as both "D:\" and "d:\").

// Lets Reanimated animated styles run synchronously in Jest.
setUpTests();

// Keyboard handling is native; tests use the library's own mock (plain View / ScrollView).
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
