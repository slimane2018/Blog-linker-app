from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Site, User, Post, Opportunity
from pydantic import BaseModel
from jose import jwt, JWTError
import os
import requests
from urllib.parse import urlparse

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-secret-key-in-production")
ALGORITHM = "HS256"

# ---- Helper: get current user from JWT token ----

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---- Pydantic schemas ----

class SiteCreate(BaseModel):
    url: str
    wp_app_password: str

class SiteResponse(BaseModel):
    id: int
    url: str
    last_crawled: str = None

    class Config:
        from_attributes = True

# ---- Routes ----

@router.post("/", response_model=SiteResponse)
def add_site(site_data: SiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Clean the URL (remove trailing slash)
    site_url = site_data.url.rstrip("/")
    
    # Try to detect WordPress API
    wp_api_url = site_url + "/wp-json/"
    try:
        resp = requests.get(wp_api_url, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not find WordPress REST API at this URL. Make sure it's a WordPress site.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=400, detail="Could not connect to the site. Check the URL.")
    
    # Check if site already exists for this user
    existing = db.query(Site).filter(Site.url == site_url, Site.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This site is already added to your account")
    
    # Validate app password by making a test request
    test_url = wp_api_url + "wp/v2/users/me"
    try:
        test_resp = requests.get(test_url, auth=(current_user.email, site_data.wp_app_password), timeout=10)
        if test_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid WordPress app password or username")
    except:
        raise HTTPException(status_code=400, detail="Could not authenticate with WordPress")
    
    # Save the site
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
    
    # Also delete related posts and opportunities
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
    
    # Crawl posts
    from app.services.crawler import crawl_site
    posts_data = crawl_site(site.url)
    
    # Save posts to database
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
    
    # Get all posts for this site
    posts = db.query(Post).filter(Post.site_id == site.id).all()
    
    # Analyze for linking opportunities
    from app.services.nlp_analyzer import analyze_opportunities
    opportunities = analyze_opportunities(posts)
    
    # Save opportunities
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
    
    # Update last crawled timestamp
    from datetime import datetime
    site.last_crawled = datetime.utcnow()
    db.commit()
    
    return {"message": "Analysis complete", "opportunities_found": len(opportunities)}