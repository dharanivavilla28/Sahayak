# Sahayak Backend

This backend is a FastAPI service for the Sahayak mobile app.

## Setup

```bash
cd sahayak-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `GET /api/health`
- `GET /api/schemes`
- `GET /api/schemes/{scheme_id}`
- `GET /api/states`
- `GET /api/schemes/search?q=query&state=stateName`
- `GET /api/schemes/filter?category=central&state=stateName`
- `POST /api/eligibility`
