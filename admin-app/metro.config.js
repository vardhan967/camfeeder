const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-webrtc') {
    return {
      filePath: require.resolve('./react-native-webrtc-mock.js'),
      type: 'sourceFile',
    };
  }
  // Optionally, chain to the standard Expo resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
