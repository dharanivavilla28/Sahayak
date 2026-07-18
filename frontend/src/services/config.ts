import Constants from "expo-constants";

import { Platform } from "react-native";

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string>;

// Dynamically determine host IP to prevent Network Errors on physical devices
const getHostIp = (): string => {
  if (extra.API_URL) {
    return extra.API_URL;
  }
  // hostUri is available in development mode (e.g. "10.45.30.252:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:8000`;
    }
  }
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
};

export const API_URL = getHostIp();
export const GROK_API_URL = extra.GROK_API_URL || "https://api.x.ai";
export const GROK_API_KEY = extra.GROK_API_KEY || "";
