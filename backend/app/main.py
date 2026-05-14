import os
from dotenv import load_dotenv

load_dotenv()

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
from app.database import engine, Base
from app.routers import chat, dashboard

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hotel Concierge API",
    description="AI-powered hotel concierge backend",
    version="1.0.0",
)

# CORS - allow frontend origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(dashboard.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


@app.get("/")
async def root():
    return {"status": "ok", "service": "Hotel Concierge API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
