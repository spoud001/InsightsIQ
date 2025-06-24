import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

# --- Router ---
router = APIRouter()

# --- Models ---
class AskRequest(BaseModel):
    dataset_id: str
    question: str

class AskResponse(BaseModel):
    answer: str
    context_chunks: list

# --- Ask Question Route ---
client = OpenAI()  # Uses OPENAI_API_KEY from .env

@router.post("/ask_question", response_model=AskResponse)
def ask_question(req: AskRequest):
    # This endpoint is deprecated. Use /data/datasets/{dataset_id}/ask_question instead.
    raise HTTPException(status_code=410, detail="This endpoint is deprecated. Use /data/datasets/{dataset_id}/ask_question instead.")
