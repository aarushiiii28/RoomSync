from fastapi import FastAPI

app = FastAPI(
    title="RoomSync AI API",
    version="1.0.0",
    description="Backend API for RoomSync AI",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to RoomSync AI Backend 🚀"
    }