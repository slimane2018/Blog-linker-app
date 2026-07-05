from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your routers
from app.routers import auth, sites, opportunities

app = FastAPI(title="Blog Linker API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bloglinker.netlify.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(sites.router, prefix="/sites", tags=["Sites"])
app.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities"])

@app.get("/")
def home():
    return {"message": "Hello from Blog Linker! The API is running."}

@app.get("/health")
def health():
    return {"status": "ok"}