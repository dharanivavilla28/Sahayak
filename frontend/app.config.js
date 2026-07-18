// app.config.js — reads sensitive values from .env via process.env
module.exports = ({ config }) => ({
  ...config,
  name: "Sahayak",
  slug: "sahayak",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sahayak.app",
  },
  web: {
    bundler: "metro",
    output: "single",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FF9933",
    },
    package: "com.sahayak.app",
  },
  extra: {
    API_URL: process.env.API_URL || "https://sahayak-api-backend.loca.lt",
    GROK_API_URL: process.env.GROK_API_URL || "https://api.x.ai",
    GROK_API_KEY: process.env.GROK_API_KEY || "",
  },
  plugins: [
    [
      "expo-av",
      {
        microphonePermission:
          "Allow Sahayak to access your microphone for voice queries.",
      },
    ],
  ],
});
