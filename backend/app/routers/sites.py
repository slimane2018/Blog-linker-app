from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Site, User, Post, Opportunity
from pydantic import BaseModel
from typing import Optional
import os
import requests

router = APIRouter()

# --- MOCK USER FOR TESTING (NO AUTH) ---
class MockUser:
    id = 1
    email = "test@test.com"

def get_current_user():
    # Always return mock user - NO AUTHENTICATION
    return MockUser()
# ---------------------------------------

# ---- Pydantic schemas ----
class SiteCreate(BaseModel):
    url: str
    wp_app_password: str
    wp_username: Optional[str] = "admin"

class SiteResponse(BaseModel):
    id: int
    url: str
    last_crawled: str = None

    class Config:
        from_attributes = True

# ---- Routes ----
@router.post("/", response_model=SiteResponse)
def add_site(site_data: SiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site_url = site_data.url.rstrip("/")
    wp_api_url = site_url + "/wp-json/"
    
    try:
        resp = requests.get(wp_api_url, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not find WordPress REST API")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=400, detail="Could not connect to the site")

    existing = db.query(Site).filter(Site.url == site_url, Site.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This site is already added")

    test_url = wp_api_url + "wp/v2/users/me"
    try:
        wp_user = site_data.wp_username if site_data.wp_username else "admin"
        test_resp = requests.get(test_url, auth=(wp_user, site_data.wp_app_password), timeout=10)
        if test_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid WordPress app password")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not authenticate with WordPress")

    new_site = Site(
        user_id=current_user.id,
        url=site_url,
        wp_api_url=wp_api_url,
        wp_app_password=site_data.wp_app_password
    )
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    return new_site

@router.get("/", response_model=list[SiteResponse])
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(Site).filter(Site.user_id == current_user.id).all()
    return sites

@router.delete("/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id, Site.user_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    db.query(Post).filter(Post.site_id == site_id).delete()
    db.query(Opportunity).filter(Opportunity.site_id == site_id).delete()
    
    db.delete(site)
    db.commit()
    return {"message": "Site deleted successfully"}

@router.post("/{site_id}/analyze")
def trigger_analysis(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id, Site.user_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    from app.services.crawler import crawl_site
    posts_data = crawl_site(site.url)

    for post_data in posts_data:
        existing_post = db.query(Post).filter(Post.url == post_data["url"]).first()
        if not existing_post:
            new_post = Post(
                site_id=site.id,
                title=post_data["title"],
                url=post_data["url"],
                content=post_data["content"],
                plain_text=post_data["plain_text"]
            )
            db.add(new_post)
    db.commit()

    posts = db.query(Post).filter(Post.site_id == site.id).all()

    from app.services.nlp_analyzer import analyze_opportunities
    opportunities = analyze_opportunities(posts)

    for opp in opportunities:
        new_opp = Opportunity(
            site_id=site.id,
            source_post_id=opp["source_post_id"],
            target_post_id=opp["target_post_id"],
            anchor_text=opp["anchor_text"],
            context_snippet=opp["context_snippet"],
            similarity_score=opp["similarity_score"],
            link_type=opp["link_type"]
        )
        db.add(new_opp)
    db.commit()

    from datetime import datetime
    site.last_crawled = datetime.utcnow()
    db.commit()

    return {"message": "Analysis complete", "opportunities_found": len(opportunities)}