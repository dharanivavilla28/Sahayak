import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://sahayak-api-backend.loca.lt";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "bypass-tunnel-reminder": "true" },
});

export const fetchSchemes = async (query?: string, state?: string, category?: string) => {
  try {
    if (query) {
      const r = await api.get("/api/schemes/search", { params: { q: query, state } });
      return r.data;
    }
    if (category || state) {
      const r = await api.get("/api/schemes/filter", { params: { category, state } });
      return r.data;
    }
    const r = await api.get("/api/schemes");
    return r.data;
  } catch (e) {
    console.error("fetchSchemes error", e);
    return [];
  }
};

export const fetchStates = async (): Promise<string[]> => {
  try {
    const r = await api.get<{ state: string; count: number }[]>("/api/schemes/states");
    return r.data.map((i) => i.state);
  } catch {
    return [];
  }
};

export const checkEligibility = async (profile: object) => {
  try {
    const r = await api.post("/api/eligibility", profile);
    return r.data;
  } catch (e) {
    console.error("checkEligibility error", e);
    return [];
  }
};

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const r = await api.post<{ reply: string }>("/api/chat", { message });
    return r.data.reply || "I couldn't find a relevant answer. Please try again.";
  } catch (e: unknown) {
    const err = (e as any)?.response?.data?.error || (e as any)?.message;
    console.error("chat error", err);
    return "I'm having trouble connecting to the AI service. Please check the Schemes tab for recommendations, or try again in a moment.";
  }
};
