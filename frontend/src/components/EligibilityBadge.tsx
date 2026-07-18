import React from "react";
import { View, Text } from "react-native";

interface EligibilityBadgeProps {
  eligible: boolean;
}

export default function EligibilityBadge({ eligible }: EligibilityBadgeProps) {
  return (
    <View className={`rounded-full px-3 py-1 ${eligible ? "bg-green-100" : "bg-red-100"}`}>
      <Text className={`text-xs font-semibold ${eligible ? "text-green-800" : "text-red-800"}`}>
        {eligible ? "Eligible" : "Not Eligible"}
      </Text>
    </View>
  );
}
