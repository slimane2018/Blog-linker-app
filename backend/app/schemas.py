from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ---- User schemas ----

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ---- Site schemas ----

class SiteCreate(BaseModel):
    url: str
    wp_app_password: str

class SiteResponse(BaseModel):
    id: int
    url: str
    last_crawled: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ---- Post schemas ----

class PostResponse(BaseModel):
    id: int
    title: str
    url: str
    status: str
    fetched_at: datetime

    class Config:
        from_attributes = True

# ---- Opportunity schemas ----

class OpportunityResponse(BaseModel):
    id: int
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    target_title: Optional[str] = None
    target_url: Optional[str] = None
    anchor_text: str
    context_snippet: Optional[str] = None
    link_type: str
    similarity_score: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplyLinkResponse(BaseModel):
    message: str
    success: bool

# ---- Generic response ----

class MessageResponse(BaseModel):
    message: str