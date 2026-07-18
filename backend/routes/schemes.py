from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import pandas as pd
from models.scheme import Scheme
from data.schemes import SCHEMES

router = APIRouter(prefix="/api/schemes", tags=["schemes"])

# NOTE: Static routes MUST come before dynamic /{scheme_id} to avoid conflicts


@router.get("/search", response_model=List[Scheme])
def search_schemes(
    q: Optional[str] = Query(None, description="Search query."),
    state: Optional[str] = Query(None, description="State filter."),
):
    df = pd.DataFrame(SCHEMES)
    if q:
        query = q.strip().lower()
        df = df[
            df["name"].str.lower().str.contains(query, na=False)
            | df["description"].str.lower().str.contains(query, na=False)
            | df["category"].str.lower().str.contains(query, na=False)
        ]
    if state:
        state_name = state.strip().lower()
        # For search, include central schemes + matching state schemes
        df = df[
            (df["category"].str.lower() == "central")
            | (df["state"].fillna("").str.lower() == state_name)
        ]
    return df.to_dict(orient="records")


@router.get("/filter", response_model=List[Scheme])
def filter_schemes(
    category: Optional[str] = Query(None, description="Scheme category filter."),
    state: Optional[str] = Query(None, description="State filter."),
):
    df = pd.DataFrame(SCHEMES)
    if category and category.lower() == "central":
        df = df[df["category"].str.lower() == "central"]
    elif category and category.lower() == "state":
        df = df[df["category"].str.lower() == "state"]
        if state:
            state_name = state.strip().lower()
            df = df[df["state"].fillna("").str.lower() == state_name]
    elif state:
        state_name = state.strip().lower()
        df = df[
            (df["category"].str.lower() == "central")
            | (df["state"].fillna("").str.lower() == state_name)
        ]
    return df.to_dict(orient="records")


@router.get("/states")
def get_states():
    df = pd.DataFrame(SCHEMES)
    state_counts = df[~df["state"].isna()]["state"].value_counts().to_dict()
    return [{"state": state, "count": int(count)} for state, count in state_counts.items()]


@router.get("", response_model=List[Scheme])
def get_all_schemes():
    return SCHEMES


@router.get("/{scheme_id}", response_model=Scheme)
def get_scheme_by_id(scheme_id: str):
    scheme = next((item for item in SCHEMES if item["id"] == scheme_id), None)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
