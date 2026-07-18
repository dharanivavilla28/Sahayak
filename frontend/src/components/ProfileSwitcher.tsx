import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import useProfileStore from "../store/profileStore";

export default function ProfileSwitcher() {
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  if (profiles.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-[#64748b] mb-2 uppercase tracking-wide">
        Switch Profile
      </Text>
      <FlatList
        data={profiles}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = item.id === activeProfileId;
          return (
            <TouchableOpacity
              onPress={() => setActiveProfile(item.id)}
              className={`mr-2 rounded-2xl px-4 py-3 border ${
                isActive
                  ? "border-[#138808] bg-[#138808]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-base mr-1">
                  {item.gender === "female" ? "👩" : item.gender === "male" ? "👨" : "🧑"}
                </Text>
                <View>
                  <Text
                    className={`text-sm font-semibold ${isActive ? "text-white" : "text-[#0f172a]"}`}
                  >
                    {item.name}
                  </Text>
                  <Text className={`text-xs ${isActive ? "text-green-100" : "text-[#64748b]"}`}>
                    {item.state} • {item.age}y
                  </Text>
                </View>
                {isActive && (
                  <Text className="ml-2 text-green-200 text-xs">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
