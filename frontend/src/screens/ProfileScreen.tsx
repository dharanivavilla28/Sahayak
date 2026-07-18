import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import useProfileStore from "../store/profileStore";
import { Profile, Gender } from "../types";

const genders: Gender[] = ["male", "female", "all"];

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export default function ProfileScreen() {
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const addProfile = useProfileStore((state) => state.addProfile);
  const removeProfile = useProfileStore((state) => state.removeProfile);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  const [name, setName] = useState("");
  const [stateName, setStateName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");

  const createProfile = async () => {
    if (!name || !stateName || !age || !income) {
      Alert.alert("Missing fields", "Please provide name, state, age, and income.");
      return;
    }

    const profile: Profile = {
      id: generateId(),
      name: name.trim(),
      state: stateName.trim(),
      age: Number(age),
      gender,
      occupation: occupation.split(",").map((item) => item.trim()).filter(Boolean),
      income: Number(income),
    };

    await addProfile(profile);
    setName("");
    setStateName("");
    setAge("");
    setIncome("");
    setOccupation("");
  };

  return (
    <View className="flex-1 bg-[#f8fafc] px-4 py-4">
      <View className="mb-4 rounded-3xl bg-white p-5 shadow-sm shadow-gray-200">
        <Text className="text-lg font-semibold text-[#0f172a] mb-3">Create New Profile</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          className="mb-3 rounded-3xl border border-gray-300 bg-[#f8fafc] px-4 py-3"
        />
        <TextInput
          value={stateName}
          onChangeText={setStateName}
          placeholder="State"
          className="mb-3 rounded-3xl border border-gray-300 bg-[#f8fafc] px-4 py-3"
        />
        <TextInput
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          keyboardType="numeric"
          className="mb-3 rounded-3xl border border-gray-300 bg-[#f8fafc] px-4 py-3"
        />
        <Text className="mb-2 text-sm text-[#475569]">Gender</Text>
        <View className="mb-3 flex-row justify-between">
          {genders.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setGender(option)}
              className={`rounded-full px-4 py-3 ${gender === option ? "bg-govgreen" : "bg-gray-100"}`}
            >
              <Text className={`${gender === option ? "text-white" : "text-[#0f172a]"}`}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={occupation}
          onChangeText={setOccupation}
          placeholder="Occupation (comma separated)"
          className="mb-3 rounded-3xl border border-gray-300 bg-[#f8fafc] px-4 py-3"
        />
        <TextInput
          value={income}
          onChangeText={setIncome}
          placeholder="Annual Income"
          keyboardType="numeric"
          className="mb-3 rounded-3xl border border-gray-300 bg-[#f8fafc] px-4 py-3"
        />
        <TouchableOpacity onPress={createProfile} className="rounded-3xl bg-saffron px-4 py-4">
          <Text className="text-center font-semibold text-white">Save Profile</Text>
        </TouchableOpacity>
      </View>
      <Text className="mb-3 text-lg font-semibold text-[#0f172a]">Your Profiles</Text>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-3xl bg-white p-4 shadow-sm shadow-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-[#0f172a]">{item.name}</Text>
              {item.id === activeProfileId && <Text className="text-sm text-green-700">Active</Text>}
            </View>
            <Text className="text-sm text-[#475569]">{item.state} • {item.age} yrs • {item.gender}</Text>
            <Text className="text-sm text-[#475569]">Income: ₹{item.income.toLocaleString()}</Text>
            <View className="mt-3 flex-row justify-between">
              <TouchableOpacity onPress={() => setActiveProfile(item.id)} className="rounded-full bg-govgreen px-4 py-2">
                <Text className="text-sm text-white">Set Active</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeProfile(item.id)} className="rounded-full bg-red-500 px-4 py-2">
                <Text className="text-sm text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text className="text-sm text-[#475569]">No profiles yet. Create one above.</Text>
        )}
      />
    </View>
  );
}
