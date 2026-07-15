from fastapi import FastAPI

from app.api.auth.routes import router as auth_router
from app.api.users.routes import router as users_router
from app.api.profile.routes import router as profile_router
from app.api.questionnaire.routes import router as questionnaire_router
from app.api.matching.routes import router as matching_router
from app.api.dashboard.routes import router as dashboard_router

app = FastAPI(
    title="RoomSync AI API",
    version="1.0.0",
    description="Backend API for RoomSync AI – Roommate Compatibility Platform",
)

# ── Register routers ──────────────────────────────────────────────────────────
API_PREFIX = "/api"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)
app.include_router(questionnaire_router, prefix=API_PREFIX)
app.include_router(matching_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {"message": "Welcome to RoomSync AI Backend 🚀"}