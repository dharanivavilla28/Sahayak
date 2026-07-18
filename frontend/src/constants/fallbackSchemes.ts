import { Scheme } from "../types";

export const fallbackSchemes: Scheme[] = [
  {
    id: "fallback-1",
    name: "Sample Scheme",
    category: "central",
    state: null,
    description: "Fallback scheme data is available when the backend is unreachable.",
    eligibility: {
      age_min: null,
      age_max: null,
      gender: "all",
      income_required: false,
      income_limit: null,
      residency_required: false,
      residency_years: null,
      occupation: [],
    },
    benefits: "Use this scheme as a placeholder until live data loads.",
    source_url: "https://example.com",
    application_link: null,
    icon: "📌",
  },
];
