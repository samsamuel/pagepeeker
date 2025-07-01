import shutil
import os
import logging
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# (Move job endpoints after app = FastAPI(...))
from fastapi import FastAPI, BackgroundTasks
import os
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional



import os
import logging

# Set DEV mode from environment variable
DEV = os.getenv("DEV", "false").lower() == "true"

# Configure logging
logging.basicConfig(level=logging.DEBUG if DEV else logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(debug=DEV, root_path="/api")

# Serve screenshots as static files
app.mount("/screenshots", StaticFiles(directory="/screenshots"), name="screenshots")

# Allow CORS for all origins (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScreenshotRequest(BaseModel):
    url: str
    width: int = 1200
    height: int = 800
    delay: Optional[int] = 2
    scale: Optional[float] = 1.0
    format: Optional[str] = "png"
    custom_js: Optional[str] = None
    custom_css: Optional[str] = None
    imagemagick_script: Optional[str] = None
    refresh: Optional[int] = None


from .celery_app import take_screenshot

@app.post("/screenshot")
def create_screenshot(req: ScreenshotRequest, background_tasks: BackgroundTasks):
    import uuid
    import json
    from datetime import datetime
    if DEV:
        logger.debug(f"Received screenshot request: {req}")
    # Generate a unique job_id
    job_id = str(uuid.uuid4())
    # Prepare job directory
    screenshots_dir = '/screenshots'
    job_dir = os.path.join(screenshots_dir, job_id)
    os.makedirs(job_dir, exist_ok=True)
    # Save request as request.json
    request_path = os.path.join(job_dir, 'request.json')
    with open(request_path, 'w') as f:
        json.dump(req.dict(), f)
    # Optionally, save a timestamp
    with open(os.path.join(job_dir, 'created_at.txt'), 'w') as f:
        f.write(datetime.utcnow().isoformat())
    # Enqueue Celery screenshot job
    try:
        logger.info(f"[backend] About to enqueue Celery task for job_id={job_id}")
        result = take_screenshot.delay(job_id, req.dict())
        logger.info(f"[backend] Celery task enqueued for job_id={job_id}, task_id={result.id}")
        if DEV:
            logger.debug(f"Celery task enqueued for job_id: {job_id}")
    except Exception as e:
        logger.error(f"Failed to enqueue Celery task: {e}")
    if DEV:
        logger.debug(f"Enqueued job_id: {job_id} at {job_dir}")
    # Try to guess the image extension for the frontend to use correct URL
    ext = req.format.lower() if req.format else "png"
    if ext not in ["png", "jpg", "jpeg", "webp", "bmp", "gif"]:
        ext = "png"
    image_url = f"/screenshots/{job_id}/screenshot.{ext}"
    return {"status": "queued", "job_id": job_id, "image_url": image_url}

@app.get("/current_screen")
def get_current_screen(job_id: str):
    import glob
    from fastapi.responses import FileResponse
    screenshots_dir = '/screenshots'
    job_dir = os.path.join(screenshots_dir, job_id)
    if not os.path.isdir(job_dir):
        if DEV:
            logger.debug(f"Job directory not found: {job_dir}")
        return {"detail": "job_id not found"}
    # Find screenshot file (png, jpg, jpeg, webp, etc)
    files = []
    for ext in ["png", "jpg", "jpeg", "webp", "bmp", "gif"]:
        files.extend(glob.glob(os.path.join(job_dir, f"screenshot*.{ext}")))
    if not files:
        if DEV:
            logger.debug(f"No screenshot found for job_id: {job_id}")
        return {"detail": "No screenshot available yet"}
    # Pick the latest file by modification time
    latest_file = max(files, key=os.path.getmtime)
    if DEV:
        logger.debug(f"Serving screenshot: {latest_file}")
    return FileResponse(latest_file, media_type="image/*")

# List all jobs (optionally filter by refresh interval)
@app.get("/jobs")
def list_jobs():
    screenshots_dir = '/screenshots'
    jobs = []
    if not os.path.isdir(screenshots_dir):
        return jobs
    for job_id in os.listdir(screenshots_dir):
        job_dir = os.path.join(screenshots_dir, job_id)
        if not os.path.isdir(job_dir):
            continue
        request_path = os.path.join(job_dir, 'request.json')
        created_at_path = os.path.join(job_dir, 'created_at.txt')
        if os.path.exists(request_path):
            try:
                import json
                with open(request_path) as f:
                    req = json.load(f)
                created_at = None
                if os.path.exists(created_at_path):
                    with open(created_at_path) as f:
                        created_at = f.read().strip()
                jobs.append({
                    "job_id": job_id,
                    "url": req.get("url"),
                    "refresh": req.get("refresh"),
                    "created_at": created_at,
                    "format": req.get("format"),
                })
            except Exception as e:
                logger.error(f"Error reading job {job_id}: {e}")
    return jobs

# Delete a job by job_id
@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    screenshots_dir = '/screenshots'
    job_dir = os.path.join(screenshots_dir, job_id)
    if not os.path.isdir(job_dir):
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        shutil.rmtree(job_dir)
        return {"status": "deleted", "job_id": job_id}
    except Exception as e:
        logger.error(f"Failed to delete job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete job")
