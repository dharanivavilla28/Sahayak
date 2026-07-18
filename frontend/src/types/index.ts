export type Gender = "male" | "female" | "all";

export interface EligibilityCriteria {
  age_min: number | null;
  age_max: number | null;
  gender: Gender | null;
  income_required: boolean;
  income_limit: number | null;
  residency_required: boolean;
  residency_years: number | null;
  occupation: string[];
}

export interface Scheme {
  id: string;
  name: string;
  category: "central" | "state";
  state: string | null;
  description: string;
  eligibility: EligibilityCriteria;
  benefits: string;
  source_url: string;
  application_link: string | null;
  icon: string;
}

export interface Profile {
  id: string;
  name: string;
  state: string;
  age: number;
  gender: Gender;
  occupation: string[];
  income: number;
}

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  status: "Applied" | "In Progress" | "Approved" | "Rejected";
  date: string;
  notes: string;
  applicationLink: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  message: string;
}

export interface EligibilityResponse {
  scheme: Scheme;
  match_score: number;
  eligible: boolean;
}
