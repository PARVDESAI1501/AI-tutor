import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest, chat, generate, sources

app = FastAPI(
    title="AI-Tutor API",
    description="Backend API for AI-Tutor — AI-powered study platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Allow both local and production frontend origins
allowed_origins = [
    "http://localhost:3000",
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)

# Also allow any Vercel preview deployments
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(chat.router)
app.include_router(generate.router)
app.include_router(sources.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-tutor-api", "version": "1.0.0"}
