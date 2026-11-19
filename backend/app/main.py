from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db

# Initialize sqlite tables
init_db()

# Import routes
from app.routes import (
    projects,
    sources,
    extraction,
    claims,
    questions,
    review,
    handover,
    audit,
    demo,
    github_analysis,
    leaver_bot
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(projects.router)
app.include_router(sources.router)
app.include_router(extraction.router)
app.include_router(claims.router)
app.include_router(questions.router)
app.include_router(review.router)
app.include_router(handover.router)
app.include_router(audit.router)
app.include_router(demo.router)
app.include_router(github_analysis.router)
app.include_router(leaver_bot.router)

@app.get("/")
def root():
    return {
        "project": "Baton",
        "tagline": "Knowledge handover that shows its evidence",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Baton Knowledge Handover API"}
