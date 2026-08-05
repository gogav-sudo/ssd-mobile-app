// Expo SDK 54: babel-preset-expo already bundles the react-native-worklets
// plugin (required by reanimated 4) when reanimated is installed — do NOT add
// react-native-reanimated/plugin or react-native-worklets/plugin here too, that
// double-registers and breaks the build.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
