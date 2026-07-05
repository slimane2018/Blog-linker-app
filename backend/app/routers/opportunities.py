from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Opportunity, Site, Post, User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# --- MOCK USER FOR TESTING (NO AUTH) ---
class MockUser:
    id = 1
    email = "test@test.com"

def get_current_user():
    return MockUser()
# ---------------------------------------

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

@router.get("/", response_model=List[OpportunityResponse])
def list_opportunities(
    site_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Opportunity).join(Site).filter(Site.user_id == current_user.id)
    if site_id:
        query = query.filter(Opportunity.site_id == site_id)
    if status:
        query = query.filter(Opportunity.status == status)
        
    opportunities = query.order_by(Opportunity.similarity_score.desc()).all()

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
    opportunity = db.query(Opportunity).join(Site).filter(
        Opportunity.id == opportunity_id,
        Site.user_id == current_user.id
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    if opportunity.status == "created":
        return {"message": "Link already created", "success": True}

    site = db.query(Site).filter(Site.id == opportunity.site_id).first()
    source_post = db.query(Post).filter(Post.id == opportunity.source_post_id).first()
    target_post = db.query(Post).filter(Post.id == opportunity.target_post_id).first()

    if not site or not source_post or not target_post:
        raise HTTPException(status_code=404, detail="Required data not found")

    from app.services.wordpress import get_post_id_by_url, insert_link_into_post
    
    wp_username = "admin"

    wp_post_id = get_post_id_by_url(
        site.wp_api_url,
        source_post.url,
        site.wp_app_password,
        wp_username
    )

    if not wp_post_id:
        raise HTTPException(status_code=400, detail="Could not find WordPress post ID")

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
        opportunity.status = "created"
        db.commit()
        return {"message": f"Link created successfully", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Failed to insert link")

@router.post("/{opportunity_id}/skip")
def skip_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    opportunity = db.query(Opportunity).join(Site).filter(
        Opportunity.id == opportunity_id,
        Site.user_id == current_user.id
    ).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    opportunity.status = "skipped"
    db.commit()
    return {"message": "Opportunity skipped successfully"}