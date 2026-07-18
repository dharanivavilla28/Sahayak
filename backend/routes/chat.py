import os
import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

GROK_API_URL = os.environ.get("GROK_API_URL", "https://api.x.ai")
GROK_API_KEY = os.environ.get("GROK_API_KEY", "")

SYSTEM_PROMPT = (
    "You are Sahayak, a helpful assistant for discovering Indian government schemes. "
    "Keep responses concise (under 200 words), friendly, and always mention specific "
    "scheme names when relevant. Respond in the language the user writes in."
)


class ChatRequest(BaseModel):
    message: str
    language: str = "en"


@router.post("/api/chat")
async def chat(req: ChatRequest):
    if not GROK_API_KEY:
        return JSONResponse(
            status_code=503,
            content={"error": "Chat API key not configured on server."},
        )

    # Dynamic fallback: support Groq key formats
    url = GROK_API_URL
    model = "grok-2-1212"  # standard fallback for xAI
    
    if GROK_API_KEY.startswith("gsk_"):
        url = "https://api.groq.com/openai"
        model = "llama-3.3-70b-versatile"

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                f"{url}/v1/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": req.message},
                    ],
                    "max_tokens": 350,
                    "temperature": 0.5,
                },
                headers={
                    "Authorization": f"Bearer {GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            data = response.json()
            if response.status_code != 200:
                error_detail = data.get("error", {})
                if isinstance(error_detail, dict):
                    error_msg = error_detail.get("message", "API error")
                else:
                    error_msg = str(error_detail)
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": error_msg},
                )
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)},
        )

