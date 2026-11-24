// Metro bundler config. Expo configures the monorepo automatically (SDK 52+).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance rule (FRONTEND.md §7.1): delay parsing and running heavy modules until a
// screen actually needs them, which cuts startup time. Expo's default is false.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

module.exports = config;
