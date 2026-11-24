// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // Keyboard avoidance is non-negotiable (FRONTEND.md §7.4): every scroll view and every
    // avoiding view must come from the keyboard-aware components, never React Native's own.
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['ScrollView', 'KeyboardAvoidingView'],
              message:
                'Use KeyboardScrollView (src/components) or Screen, or KeyboardAvoidingView from react-native-keyboard-controller (FRONTEND.md §7.4).',
            },
          ],
        },
      ],
    },
  },
]);
