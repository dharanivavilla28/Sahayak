from typing import List, Optional
from pydantic import BaseModel


class EligibilityCriteria(BaseModel):
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[str] = None
    income_required: bool = False
    income_limit: Optional[int] = None
    residency_required: bool = False
    residency_years: Optional[int] = None
    occupation: List[str] = []


class Scheme(BaseModel):
    id: str
    name: str
    category: str
    state: Optional[str] = None
    description: str
    eligibility: EligibilityCriteria
    benefits: str
    source_url: str
    application_link: Optional[str] = None
    icon: str


class ProfileData(BaseModel):
    """Profile submitted from the frontend for eligibility checking."""
    name: Optional[str] = None
    state: str
    age: int
    gender: str
    occupation: List[str] = []
    income: int
    # Optional nested profiles for family members
    profiles: Optional[List["ProfileData"]] = None

    model_config = {"arbitrary_types_allowed": True}


# Required for self-referencing model (forward ref)
ProfileData.model_rebuild()


class EligibilityResponse(BaseModel):
    scheme: Scheme
    match_score: int
    eligible: bool
