import axios from "axios";
import { GROK_API_KEY, GROK_API_URL } from "./config";

// xAI Grok API uses OpenAI-compatible chat completions endpoint
const grokClient = axios.create({
  baseURL: GROK_API_URL,
  timeout: 20000,
  headers: {
    Authorization: `Bearer ${GROK_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const queryGrok = async (prompt: string, model = "grok-3-mini"): Promise<string> => {
  if (!GROK_API_KEY) {
    // Fallback: return a local response when no API key
    return "I can help you find government schemes! Please make sure your profile is set up in the Profile tab, then browse the Schemes tab for personalized recommendations.";
  }

  try {
    const response = await grokClient.post("/v1/chat/completions", {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Sahayak, a helpful assistant for discovering Indian government schemes. Keep responses concise (under 200 words), friendly, and always mention specific scheme names when relevant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    return (
      response.data?.choices?.[0]?.message?.content ||
      "I could not find a relevant answer. Please try rephrasing your question."
    );
  } catch (error: any) {
    console.error("Grok API error:", error?.response?.data || error?.message);
    // Graceful fallback instead of crashing
    return "I'm having trouble connecting to the AI service right now. Please check the Schemes tab for your personalized recommendations, or try again in a moment.";
  }
};
