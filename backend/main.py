import sys
from dotenv import load_dotenv

# Load .env variables before routing/config imports
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from routes import schemes, eligibility, chat

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

app = FastAPI(
    title="Sahayak Backend",
    version="1.0.0",
    description="Backend API for Sahayak — Intelligent Government Scheme Discovery Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schemes.router)
app.include_router(eligibility.router)
app.include_router(chat.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Sahayak backend is running", "version": "1.0.0"}


@app.get("/")
def root():
    return {
        "app": "Sahayak",
        "docs": "/docs",
        "health": "/api/health",
        "schemes": "/api/schemes",
        "eligibility": "/api/eligibility",
    }
