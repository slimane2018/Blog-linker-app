from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    url = Column(String, unique=True)
    wp_api_url = Column(String)
    wp_app_password = Column(String)  # encrypted
    last_crawled = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"))
    wp_post_id = Column(Integer)
    title = Column(String)
    url = Column(String)
    content = Column(Text)
    plain_text = Column(Text)
    status = Column(String, default="publish")
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())

class Opportunity(Base):
    __tablename__ = "opportunities"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"))
    source_post_id = Column(Integer, ForeignKey("posts.id"))
    target_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    target_url = Column(String, nullable=True)
    anchor_text = Column(String)
    context_snippet = Column(Text)
    link_type = Column(String)  # 'internal' or 'external'
    similarity_score = Column(Float, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())