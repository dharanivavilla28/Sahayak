import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import useProfileStore from "./src/store/profileStore";
import { ActivityIndicator, View } from "react-native";

export default function App() {
  const [loading, setLoading] = useState(true);
  const loadProfiles = useProfileStore((state) => state.loadProfiles);

  useEffect(() => {
    const initialize = async () => {
      await loadProfiles();
      setLoading(false);
    };
    initialize();
  }, [loadProfiles]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <ActivityIndicator size="large" color="#138808" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
