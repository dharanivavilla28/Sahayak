import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { ChatMessage, Profile, Scheme } from "../types";
import useProfileStore from "../store/profileStore";
import { checkEligibility, fetchSchemes } from "../services/api";
import { retrieveWithGrok } from "../services/grokRetrieval";

interface ChatbotState {
  profiles: Profile[];
  activeProfileId: string | null;
}

const suggestions = [
  "Show me all central schemes",
  "Find schemes for elderly",
  "Pension schemes for women",
  "Health insurance schemes",
  "Farming support schemes",
  "Schemes for students",
];

export default function ChatbotScreen() {
  const profiles = useProfileStore((state: ChatbotState) => state.profiles);
  const activeProfileId = useProfileStore((state: ChatbotState) => state.activeProfileId);
  const activeProfile = profiles.find((profile: Profile) => profile.id === activeProfileId) || null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      message: `👋 Namaste! I'm your Sahayak assistant. I can help you find government schemes you're eligible for.\n\n${activeProfile ? `I see your active profile is **${activeProfile.name}** from **${activeProfile.state}**. Ask me anything!` : "Please set up your profile in the Profile tab for personalized scheme recommendations."}`,
    },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const flatListRef = useRef<FlatList>(null);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return updated;
    });
  };

  const speak = (text: string) => {
    // Strip markdown-style bold markers for TTS
    const cleanText = text.replace(/\*\*/g, "");
    Speech.speak(cleanText, { language, rate: 0.9 });
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: "user", message: text.trim() };
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      let responseText: string;
      if (!activeProfile) {
        responseText =
          "Please create and select a profile first in the **Profile** tab. Once set up, I can give you personalized scheme recommendations based on your state, age, income, and occupation.";
      } else {
        const schemes = await fetchSchemes();
        responseText = await retrieveWithGrok(text, schemes as Scheme[]);
      }
      const botMessage: ChatMessage = { id: `${Date.now()}-bot`, role: "bot", message: responseText };
      addMessage(botMessage);
      speak(responseText);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: "bot",
        message: "Sorry, I encountered an error. Please check your internet connection and try again.",
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Microphone permission is needed for voice input.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, staysActiveInBackground: false });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
    } catch (error) {
      console.error("Recording error", error);
      Alert.alert("Recording Failed", "Unable to start voice recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      // Voice transcription would require a speech-to-text API
      // For now, inform the user
      addMessage({
        id: `${Date.now()}-bot`,
        role: "bot",
        message:
          "🎙️ Voice recorded! For full voice-to-text support, connect a speech recognition API. Meanwhile, you can type your query below.",
      });
    } catch (error) {
      console.error("Stop recording error", error);
      setRecording(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#f8fafc]"
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="px-4 pt-12 pb-3 bg-white shadow-sm shadow-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-[#0f172a]">🤖 Sahayak Assistant</Text>
            <Text className="text-xs text-[#64748b]">Powered by Grok AI</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setLanguage("en-IN")}
              className={`rounded-full px-3 py-1.5 ${language === "en-IN" ? "bg-[#138808]" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${language === "en-IN" ? "text-white" : "text-[#0f172a]"}`}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("hi-IN")}
              className={`rounded-full px-3 py-1.5 ${language === "hi-IN" ? "bg-[#FF9933]" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${language === "hi-IN" ? "text-white" : "text-[#0f172a]"}`}>HI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick suggestions */}
      <View className="px-4 py-3">
        <FlatList
          data={suggestions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleUserMessage(item)}
              className="mr-2 rounded-full border border-[#FF9933] px-3 py-2"
            >
              <Text className="text-xs font-semibold text-[#FF9933]">{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View
            className={`mb-3 max-w-[85%] rounded-3xl px-4 py-3 ${
              item.role === "user"
                ? "self-end bg-[#138808]"
                : "self-start bg-white shadow-sm shadow-gray-200"
            }`}
          >
            <Text
              className={`text-sm leading-5 ${
                item.role === "user" ? "text-white" : "text-[#0f172a]"
              }`}
            >
              {item.message}
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          isLoading ? (
            <View className="self-start mb-3 bg-white rounded-3xl px-5 py-3 shadow-sm shadow-gray-200">
              <ActivityIndicator size="small" color="#138808" />
            </View>
          ) : null
        }
      />

      {/* Input area */}
      <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about any scheme..."
            className="flex-1 rounded-full border border-gray-200 bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a]"
            onSubmitEditing={() => handleUserMessage(input)}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={recording ? stopRecording : startRecording}
            className={`rounded-full p-3 ${recording ? "bg-red-500" : "bg-[#FF9933]"}`}
            disabled={isLoading}
          >
            <Text className="text-white text-sm">{recording ? "⏹" : "🎙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleUserMessage(input)}
            className="rounded-full bg-[#138808] px-4 py-3"
            disabled={isLoading || !input.trim()}
          >
            <Text className="text-white text-sm font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
