import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useProfileStore from "../store/profileStore";
import { checkEligibility } from "../services/api";
import SchemeCard from "../components/SchemeCard";
import ProfileSwitcher from "../components/ProfileSwitcher";
import LoadingSpinner from "../components/LoadingSpinner";
import { Scheme, EligibilityResponse } from "../types";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const [recommended, setRecommended] = useState<EligibilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const loadRecommendations = useCallback(async () => {
    if (!activeProfile) {
      setRecommended([]);
      setLoading(false);
      return;
    }
    try {
      const response = await checkEligibility(activeProfile);
      // Top 5 eligible + high-match schemes
      setRecommended(response.slice(0, 5));
    } catch {
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    setLoading(true);
    loadRecommendations();
  }, [loadRecommendations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  const eligibleCount = recommended.filter((r) => r.eligible).length;

  return (
    <ScrollView
      className="flex-1 bg-[#f8fafc]"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#138808" />}
    >
      {/* Hero Banner */}
      <View className="bg-[#138808] px-6 pt-14 pb-8">
        <Text className="text-3xl font-bold text-white">🇮🇳 Sahayak</Text>
        <Text className="text-sm text-green-100 mt-1">
          Discover government schemes you deserve
        </Text>
        {activeProfile && (
          <View className="mt-4 rounded-2xl bg-white/20 px-4 py-3">
            <Text className="text-white font-semibold text-base">
              {activeProfile.name}
            </Text>
            <Text className="text-green-100 text-sm">
              {activeProfile.state} • {activeProfile.age} yrs • {activeProfile.gender}
            </Text>
            <Text className="text-green-100 text-sm">
              Income: ₹{activeProfile.income.toLocaleString("en-IN")}/yr
            </Text>
          </View>
        )}
      </View>

      {/* Stats pills */}
      {activeProfile && (
        <View className="flex-row px-4 -mt-4 gap-2 mb-4">
          <View className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-200 items-center">
            <Text className="text-2xl font-bold text-[#138808]">{eligibleCount}</Text>
            <Text className="text-xs text-[#64748b]">Eligible</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-200 items-center">
            <Text className="text-2xl font-bold text-[#FF9933]">{recommended.length}</Text>
            <Text className="text-xs text-[#64748b]">Matched</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-200 items-center">
            <Text className="text-2xl font-bold text-[#000080]">{profiles.length}</Text>
            <Text className="text-xs text-[#64748b]">Profiles</Text>
          </View>
        </View>
      )}

      <View className="px-4">
        {/* Profile switcher */}
        <ProfileSwitcher />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => navigation.navigate("Schemes")}
            className="flex-1 rounded-2xl bg-[#138808] px-4 py-4"
          >
            <Text className="text-2xl">🔍</Text>
            <Text className="text-white font-semibold mt-1">Browse Schemes</Text>
            <Text className="text-green-100 text-xs">All schemes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            className="flex-1 rounded-2xl bg-[#FF9933] px-4 py-4"
          >
            <Text className="text-2xl">👨‍👩‍👧‍👦</Text>
            <Text className="text-white font-semibold mt-1">Family Profiles</Text>
            <Text className="text-orange-100 text-xs">Manage profiles</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Schemes */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-[#0f172a]">Recommended for You</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Schemes")}>
              <Text className="text-sm text-[#138808] font-semibold">See All →</Text>
            </TouchableOpacity>
          </View>

          {!activeProfile ? (
            <View className="rounded-2xl bg-white p-6 shadow-sm shadow-gray-200 items-center">
              <Text className="text-4xl mb-3">👤</Text>
              <Text className="text-base font-semibold text-[#0f172a] text-center">
                Create a Profile to Get Started
              </Text>
              <Text className="text-sm text-[#64748b] text-center mt-2">
                Add your details to discover schemes you're eligible for
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Profile")}
                className="mt-4 rounded-full bg-[#138808] px-6 py-3"
              >
                <Text className="text-white font-semibold">Create Profile</Text>
              </TouchableOpacity>
            </View>
          ) : recommended.length === 0 ? (
            <View className="rounded-2xl bg-white p-5 shadow-sm shadow-gray-200">
              <Text className="text-sm text-[#64748b]">
                No schemes matched for this profile. Try browsing all schemes or update your profile details.
              </Text>
            </View>
          ) : (
            recommended.map((item) => (
              <SchemeCard
                key={item.scheme.id}
                scheme={item.scheme}
                profile={activeProfile}
                matchScore={item.match_score}
                eligible={item.eligible}
                onPress={() => {}}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
