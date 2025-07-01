from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

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

@app.post("/screenshot")
def create_screenshot(req: ScreenshotRequest, background_tasks: BackgroundTasks):
    # TODO: enqueue screenshot job
    job_id = "abcd1234"  # placeholder
    return {"status": "queued", "image_url": f"/current_screen?job_id={job_id}"}

@app.get("/current_screen")
def get_current_screen(job_id: str):
    # TODO: serve latest screenshot for job_id
    return {"detail": "Not implemented"}
