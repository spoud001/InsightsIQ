from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth_routes import router as auth_router
from models import Base
from database import engine
from dataset_routes import router as dataset_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use your frontend URL, not "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(dataset_router, prefix="/data", tags=["data"])

@app.get("/")
def read_root():
    return {"message": "InsightIQ backend is running!"}
