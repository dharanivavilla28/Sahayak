import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { fetchSchemes, fetchStates } from "../services/api";
import useProfileStore from "../store/profileStore";
import SchemeCard from "../components/SchemeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { Scheme } from "../types";
import { calculateMatchScore, isEligible } from "../utils/eligibility";

const filters = ["All", "Central", "State"];

export default function SchemesScreen() {
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedState, setSelectedState] = useState(activeProfile?.state || "Delhi");
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search query by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const category =
        selectedFilter === "Central" ? "central" : selectedFilter === "State" ? "state" : undefined;
      const data = await fetchSchemes(debouncedQuery || undefined, selectedState, category);
      setSchemes(data);
    } catch {
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedFilter, selectedState]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const stateList = await fetchStates();
        const uniqueStates = stateList.length
          ? stateList
          : ["Delhi", "Karnataka", "Maharashtra", "Tamil Nadu", "West Bengal"];
        setStates(uniqueStates);
        setSelectedState(activeProfile?.state || uniqueStates[0]);
      } catch {
        setStates(["Delhi", "Karnataka", "Maharashtra", "Tamil Nadu", "West Bengal"]);
      }
    };
    initialize();
  }, [activeProfile?.state]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchemes();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#f8fafc]">
      {/* Header */}
      <View className="bg-[#000080] px-4 pt-12 pb-5">
        <Text className="text-xl font-bold text-white mb-3">Browse Schemes</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search schemes by name, category..."
          placeholderTextColor="#94a3b8"
          className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white border border-white/20"
        />
      </View>

      {/* Category Filter */}
      <View className="flex-row bg-white px-4 py-3 border-b border-gray-100">
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            className={`mr-2 rounded-full px-4 py-2 ${selectedFilter === filter ? "bg-[#138808]" : "bg-gray-100"}`}
          >
            <Text
              className={`text-sm font-semibold ${selectedFilter === filter ? "text-white" : "text-[#374151]"}`}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* State Filter (shown for State/All filters) */}
      {selectedFilter !== "Central" && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <Text className="text-xs font-semibold text-[#64748b] mb-2">Filter by State</Text>
          <FlatList
            data={states}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item: stateName }) => (
              <TouchableOpacity
                onPress={() => setSelectedState(stateName)}
                className={`mr-2 rounded-full px-3 py-1.5 ${selectedState === stateName ? "bg-[#FF9933]" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-xs font-semibold ${selectedState === stateName ? "text-white" : "text-[#374151]"}`}
                >
                  {stateName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Schemes List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={schemes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#138808" />
          }
          ListHeaderComponent={() => (
            <Text className="text-xs text-[#64748b] mb-3">
              {schemes.length} scheme{schemes.length !== 1 ? "s" : ""} found
            </Text>
          )}
          renderItem={({ item }) => (
            <SchemeCard
              scheme={item}
              profile={activeProfile}
              matchScore={activeProfile ? calculateMatchScore(activeProfile, item) : undefined}
              eligible={activeProfile ? isEligible(activeProfile, item) : undefined}
              onPress={() => {}}
            />
          )}
          ListEmptyComponent={() => (
            <View className="mt-12 items-center">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-base font-semibold text-[#0f172a]">No schemes found</Text>
              <Text className="text-sm text-[#64748b] text-center mt-2">
                Try changing the search term, category filter, or state selection.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
