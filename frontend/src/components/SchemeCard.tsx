import React from "react";
import { View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { Scheme, Profile, Application } from "../types";
import useProfileStore from "../store/profileStore";

interface SchemeCardProps {
  scheme: Scheme;
  profile?: Profile | null;
  matchScore?: number;
  eligible?: boolean;
  onPress: () => void;
}

export default function SchemeCard({ scheme, profile, matchScore, eligible, onPress }: SchemeCardProps) {
  const addApplication = useProfileStore((state) => state.addApplication);

  const handleApply = async () => {
    if (!profile) {
      Alert.alert("No Profile", "Please set an active profile first.");
      return;
    }

    Alert.alert(
      "Apply for Scheme",
      `Save "${scheme.name}" to your applications and open the application portal?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save & Open",
          onPress: async () => {
            const application: Application = {
              id: `${Date.now()}-${scheme.id}`,
              schemeId: scheme.id,
              schemeName: scheme.name,
              status: "Applied",
              date: new Date().toLocaleDateString("en-IN"),
              notes: "",
              applicationLink: scheme.application_link,
            };
            await addApplication(application);
            if (scheme.application_link || scheme.source_url) {
              const url = scheme.application_link || scheme.source_url;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) Linking.openURL(url);
            }
          },
        },
      ]
    );
  };

  const score = matchScore ?? 0;
  const scoreColor = score >= 80 ? "#138808" : score >= 60 ? "#FF9933" : "#ef4444";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mb-3 rounded-2xl bg-white shadow-sm shadow-gray-200 overflow-hidden"
    >
      {/* Colored top strip based on category */}
      <View className={`h-1 ${scheme.category === "central" ? "bg-[#000080]" : "bg-[#FF9933]"}`} />

      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-2">{scheme.icon}</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-[#0f172a]" numberOfLines={2}>
                {scheme.name}
              </Text>
              <View className="flex-row items-center mt-1 gap-2">
                <View
                  className={`rounded-full px-2 py-0.5 ${scheme.category === "central" ? "bg-blue-100" : "bg-orange-100"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${scheme.category === "central" ? "text-[#000080]" : "text-[#c2410c]"}`}
                  >
                    {scheme.category === "central" ? "🏛 Central" : `🗺 ${scheme.state}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Match score circle */}
          {profile && (
            <View className="items-center ml-2">
              <View
                className="w-12 h-12 rounded-full items-center justify-center border-2"
                style={{ borderColor: scoreColor }}
              >
                <Text className="text-xs font-bold" style={{ color: scoreColor }}>
                  {score}%
                </Text>
              </View>
              <Text className="text-xs text-[#64748b] mt-0.5">match</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-sm text-[#475569] mb-2" numberOfLines={2}>
          {scheme.description}
        </Text>

        {/* Benefits */}
        <View className="rounded-xl bg-green-50 px-3 py-2 mb-3">
          <Text className="text-xs font-semibold text-[#138808]">💰 Benefits</Text>
          <Text className="text-xs text-[#374151] mt-0.5" numberOfLines={2}>
            {scheme.benefits}
          </Text>
        </View>

        {/* Footer row */}
        <View className="flex-row items-center justify-between">
          {profile ? (
            <View className={`rounded-full px-3 py-1 ${eligible ? "bg-green-100" : "bg-red-100"}`}>
              <Text className={`text-xs font-bold ${eligible ? "text-green-700" : "text-red-600"}`}>
                {eligible ? "✓ Eligible" : "✗ Not Eligible"}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={handleApply}
            className="rounded-full bg-[#138808] px-4 py-1.5"
          >
            <Text className="text-xs font-semibold text-white">Apply →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
