from fastapi import APIRouter
from models.scheme import Scheme, ProfileData, EligibilityResponse
from data.schemes import SCHEMES
from typing import List, Dict

router = APIRouter(prefix="/api/eligibility", tags=["eligibility"])


def _normalize_keywords(values: List[str]) -> List[str]:
    return [value.strip().lower() for value in values if value]


def _check_eligibility(profile: ProfileData, scheme: Dict) -> EligibilityResponse:
    criteria_met = 0
    total_criteria = 5
    eligibility = scheme["eligibility"]
    eligible = True

    if scheme["category"] == "state" and scheme["state"]:
        if profile.state.strip().lower() != scheme["state"].strip().lower():
            eligible = False
        else:
            criteria_met += 1
    else:
        criteria_met += 1

    if eligibility.get("age_min") is not None or eligibility.get("age_max") is not None:
        age_ok = True
        if eligibility.get("age_min") is not None and profile.age < eligibility.get("age_min"):
            age_ok = False
        if eligibility.get("age_max") is not None and profile.age > eligibility.get("age_max"):
            age_ok = False
        if age_ok:
            criteria_met += 1
        else:
            eligible = False
    else:
        criteria_met += 1

    if eligibility.get("gender") and eligibility.get("gender") != "all":
        if profile.gender.strip().lower() != eligibility.get("gender").strip().lower():
            eligible = False
        else:
            criteria_met += 1
    else:
        criteria_met += 1

    if eligibility.get("income_required"):
        if profile.income is None or eligibility.get("income_limit") is None or profile.income > eligibility.get("income_limit"):
            eligible = False
        else:
            criteria_met += 1
    else:
        criteria_met += 1

    occupation_keywords = _normalize_keywords(eligibility.get("occupation", []))
    if occupation_keywords:
        profile_occupations = _normalize_keywords(profile.occupation)
        if any(keyword in profile_occupations for keyword in occupation_keywords):
            criteria_met += 1
        else:
            eligible = False
    else:
        criteria_met += 1

    match_score = int((criteria_met / total_criteria) * 100)
    return EligibilityResponse(scheme=scheme, match_score=match_score, eligible=eligible)


@router.post("", response_model=List[EligibilityResponse])
def compute_eligibility(profile: ProfileData):
    matched = []
    for scheme in SCHEMES:
        response = _check_eligibility(profile, scheme)
        if response.match_score >= 40:
            matched.append(response)
    return sorted(matched, key=lambda item: (not item.eligible, -item.match_score))
