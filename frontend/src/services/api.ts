import axios from "axios";
import { Profile, Scheme, EligibilityResponse } from "../types";
import { API_URL } from "./config";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const fetchSchemes = async (query?: string, state?: string, category?: string): Promise<Scheme[]> => {
  try {
    if (query) {
      const response = await api.get<Scheme[]>("/api/schemes/search", { params: { q: query, state } });
      return response.data;
    }
    if (category || state) {
      const response = await api.get<Scheme[]>("/api/schemes/filter", { params: { category, state } });
      return response.data;
    }
    const response = await api.get<Scheme[]>("/api/schemes");
    return response.data;
  } catch (error) {
    console.error("fetchSchemes error", error);
    return [];
  }
};

export const fetchStates = async (): Promise<string[]> => {
  try {
    const response = await api.get<{ state: string; count: number }[]>("/api/schemes/states");
    return response.data.map((item) => item.state);
  } catch (error) {
    console.error("fetchStates error", error);
    return [];
  }
};

export const checkEligibility = async (profile: Profile): Promise<EligibilityResponse[]> => {
  try {
    const response = await api.post<EligibilityResponse[]>("/api/eligibility", profile);
    return response.data;
  } catch (error) {
    console.error("checkEligibility error", error);
    return [];
  }
};
