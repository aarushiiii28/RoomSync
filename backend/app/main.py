from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.onboarding import router as onboarding_router
from app.routers.matching import router as matching_router

app = FastAPI(
    title="RoomSync API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(onboarding_router)
app.include_router(matching_router)

@app.get("/")
def root():
    return {"message": "RoomSync Backend Running"}