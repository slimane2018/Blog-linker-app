from celery import Celery
import os

# Create the Celery app
# This connects to Redis (a message queue) for background tasks
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "blog_linker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Import tasks so they are registered
from app.tasks import analyze_site

# This makes sure the worker knows about the tasks
celery_app.autodiscover_tasks(["app"])