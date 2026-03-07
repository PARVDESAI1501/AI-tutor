from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest

app = FastAPI(
    title="AI-Tutor API",
    description="Backend API for AI-Tutor — AI-powered study platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-tutor-api"}
