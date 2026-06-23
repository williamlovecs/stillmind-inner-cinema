const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Required by expo-sqlite's web worker. Monorepo paths remain auto-configured by Expo.
config.resolver.assetExts.push("wasm");

module.exports = config;
