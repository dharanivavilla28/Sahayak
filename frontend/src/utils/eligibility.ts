import { EligibilityCriteria, Profile, Scheme } from "../types";

export const calculateMatchScore = (profile: Profile, scheme: Scheme): number => {
  const eligibility: EligibilityCriteria = scheme.eligibility;
  let criteriaMet = 0;
  const totalCriteria = 5;

  const stateMatch = scheme.category === "central" || (scheme.state?.toLowerCase() === profile.state.toLowerCase());
  if (stateMatch) criteriaMet += 1;

  const ageOK = (eligibility.age_min === null || profile.age >= eligibility.age_min) &&
    (eligibility.age_max === null || profile.age <= eligibility.age_max);
  if (ageOK) criteriaMet += 1;

  const genderMatch = eligibility.gender === null || eligibility.gender === "all" || eligibility.gender === profile.gender;
  if (genderMatch) criteriaMet += 1;

  const incomeOK = !eligibility.income_required || (eligibility.income_limit !== null && profile.income <= eligibility.income_limit);
  if (incomeOK) criteriaMet += 1;

  const occupationKeywords = eligibility.occupation.map((item) => item.toLowerCase());
  const occupationMatch = occupationKeywords.length === 0 || profile.occupation.some((occupation) =>
    occupationKeywords.some((keyword) => occupation.toLowerCase().includes(keyword)),
  );
  if (occupationMatch) criteriaMet += 1;

  return Math.round((criteriaMet / totalCriteria) * 100);
};

export const isEligible = (profile: Profile, scheme: Scheme): boolean => {
  return calculateMatchScore(profile, scheme) >= 70;
};
