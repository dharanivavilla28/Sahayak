import axios from "axios";
import { API_URL } from "./config";

// Chat goes through the Sahayak backend which holds the API key securely
const backendClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export const queryGrok = async (
  prompt: string,
  language = "en"
): Promise<string> => {
  try {
    const response = await backendClient.post("/api/chat", {
      message: prompt,
      language,
    });
    return (
      response.data?.reply ||
      "I could not find a relevant answer. Please try rephrasing your question."
    );
  } catch (error: any) {
    const serverError =
      error?.response?.data?.error || error?.message || "Unknown error";
    console.error("Grok API error:", serverError);

    // Friendly fallback message instead of crashing
    return "I'm having trouble connecting to the AI service right now. Please check the Schemes tab for your personalized recommendations, or try again in a moment.";
  }
};
