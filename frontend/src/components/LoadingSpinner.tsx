import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-4">
      <ActivityIndicator size="large" color="#138808" />
      <Text className="mt-3 text-sm text-[#475569]">{message}</Text>
    </View>
  );
}
