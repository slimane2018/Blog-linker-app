from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Opportunity, Site, Post, User
from pydantic import BaseModel
from jose import jwt, JWTError
from typing import List, Optional
from datetime import datetime
import os

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-secret-key-in-production")
ALGORITHM = "HS256"

# ---- Helper: get current user from JWT token ----

class MockUser:
    id = 1
    email = "test@test.com"

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    # Always return mock user - NO AUTHENTICATION
    return MockUser()

# ---- Pydantic schemas ----

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

    class Config:
        from_attributes = True

class ApplyLinkResponse(BaseModel):
    message: str
    success: bool

# ---- Routes ----

@router.get("/", response_model=List[OpportunityResponse])
def list_opportunities(
    site_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all linking opportunities for the current user.
    You can filter by site_id and/or status (pending, created, skipped).
    """
    query = db.query(Opportunity).join(Site).filter(Site.user_id == current_user.id)
    
    if site_id:
        query = query.filter(Opportunity.site_id == site_id)
    if status:
        query = query.filter(Opportunity.status == status)
    
    opportunities = query.order_by(Opportunity.similarity_score.desc()).all()
    
    # Enrich with post titles
    result = []
    for opp in opportunities:
        source_post = db.query(Post).filter(Post.id == opp.source_post_id).first()
        target_post = db.query(Post).filter(Post.id == opp.target_post_id).first()
        
        result.append({
            "id": opp.id,
            "source_title": source_post.title if source_post else None,
            "source_url": source_post.url if source_post else None,
            "target_title": target_post.title if target_post else None,
            "target_url": target_post.url if target_post else None,
            "anchor_text": opp.anchor_text,
            "context_snippet": opp.context_snippet,
            "link_type": opp.link_type,
            "similarity_score": opp.similarity_score,
            "status": opp.status
        })
    
    return result


@router.post("/{opportunity_id}/apply", response_model=ApplyLinkResponse)
def apply_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create the link for a specific opportunity.
    This will insert the anchor link into the source post via WordPress API.
    """
    # Find the opportunity
    opportunity = db.query(Opportunity).join(Site).filter(
        Opportunity.id == opportunity_id,
        Site.user_id == current_user.id
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if opportunity.status == "created":
        return {"message": "Link already created for this opportunity", "success": True}
    
    # Get the site and source/target posts
    site = db.query(Site).filter(Site.id == opportunity.site_id).first()
    source_post = db.query(Post).filter(Post.id == opportunity.source_post_id).first()
    target_post = db.query(Post).filter(Post.id == opportunity.target_post_id).first()
    
    if not site or not source_post or not target_post:
        raise HTTPException(status_code=404, detail="Required data not found")
    
    # Get the WordPress post ID for the source post
    from app.services.wordpress import get_post_id_by_url, insert_link_into_post
    
    # Use the user's email as the WordPress username (common setup)
    # You might need to let the user configure their WordPress username later
    wp_username = current_user.email
    
    # Get the WordPress post ID
    wp_post_id = get_post_id_by_url(
        site.wp_api_url,
        source_post.url,
        site.wp_app_password,
        wp_username
    )
    
    if not wp_post_id:
        raise HTTPException(
            status_code=400, 
            detail="Could not find the WordPress post ID. Make sure the post exists."
        )
    
    # Insert the link
    success = insert_link_into_post(
        site.wp_api_url,
        site.wp_app_password,
        wp_username,
        wp_post_id,
        target_post.url,
        opportunity.anchor_text,
        opportunity.link_type
    )
    
    if success:
        # Update the opportunity status
        opportunity.status = "created"
        db.commit()
        return {"message": f"Link created successfully from '{source_post.title}' to '{target_post.title}'", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Failed to insert link into WordPress post")


@router.post("/{opportunity_id}/skip")
def skip_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an opportunity as skipped (user doesn't want to create this link).
    """
    opportunity = db.query(Opportunity).join(Site).filter(
        Opportunity.id == opportunity_id,
        Site.user_id == current_user.id
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opportunity.status = "skipped"
    db.commit()
    
    return {"message": "Opportunity skipped successfully"}