import React from "react";
import { View, Text, FlatList, TouchableOpacity, Linking, Alert } from "react-native";
import useProfileStore from "../store/profileStore";
import { Application } from "../types";

const STATUS_COLORS: Record<Application["status"], string> = {
  Applied: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
};

const STATUS_ICONS: Record<Application["status"], string> = {
  Applied: "📋",
  "In Progress": "⏳",
  Approved: "✅",
  Rejected: "❌",
};

const ALL_STATUSES: Application["status"][] = ["Applied", "In Progress", "Approved", "Rejected"];

export default function ApplicationsScreen() {
  const applications = useProfileStore((state) => state.applications);
  const updateApplicationStatus = useProfileStore((state) => state.updateApplicationStatus);

  const handleStatusChange = (appId: string, currentStatus: Application["status"]) => {
    Alert.alert(
      "Update Status",
      "Change the application status:",
      ALL_STATUSES.map((status) => ({
        text: `${STATUS_ICONS[status]} ${status}`,
        style: status === "Rejected" ? "destructive" : "default",
        onPress: () => updateApplicationStatus(appId, status),
      }))
    );
  };

  const handleOpenPortal = async (link: string | null) => {
    if (!link) {
      Alert.alert("No Link", "No application portal link is available for this scheme.");
      return;
    }
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) {
      Linking.openURL(link);
    } else {
      Alert.alert("Cannot Open", "Unable to open this link.");
    }
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      {/* Header */}
      <View className="bg-[#FF9933] px-4 pt-12 pb-5">
        <Text className="text-xl font-bold text-white">My Applications</Text>
        <Text className="text-orange-100 text-sm mt-1">
          {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
        </Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const colorClasses = STATUS_COLORS[item.status].split(" ");
          const bgClass = colorClasses[0];
          const textClass = colorClasses[1];

          return (
            <View className="mb-3 rounded-2xl bg-white shadow-sm shadow-gray-200 overflow-hidden">
              <View className="h-1 bg-[#FF9933]" />
              <View className="p-4">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#0f172a]" numberOfLines={2}>
                      {item.schemeName}
                    </Text>
                    <Text className="text-xs text-[#64748b] mt-0.5">
                      Applied on {item.date}
                    </Text>
                  </View>
                  {/* Status badge */}
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item.id, item.status)}
                    className={`rounded-full px-3 py-1 ml-2 ${bgClass}`}
                  >
                    <Text className={`text-xs font-bold ${textClass}`}>
                      {STATUS_ICONS[item.status]} {item.status}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                {item.notes ? (
                  <View className="rounded-xl bg-gray-50 px-3 py-2 mb-3">
                    <Text className="text-xs text-[#374151]">{item.notes}</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <TouchableOpacity
                  onPress={() => handleOpenPortal(item.applicationLink)}
                  className="rounded-full bg-[#138808] px-4 py-2.5"
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    🌐 Open Application Portal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View className="mt-16 items-center px-6">
            <Text className="text-5xl mb-4">📂</Text>
            <Text className="text-lg font-bold text-[#0f172a] text-center">
              No Applications Yet
            </Text>
            <Text className="text-sm text-[#64748b] text-center mt-2">
              Browse schemes and tap the "Apply" button to save and track your applications here.
            </Text>
          </View>
        )}
      />
    </View>
  );
}
