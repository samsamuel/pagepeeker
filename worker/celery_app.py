
from celery import Celery
import os
import json
from pathlib import Path
from PIL import Image

celery_app = Celery(
    'worker',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0'
)

@celery_app.task
def take_screenshot(job_id, config):
    """
    Celery task to take a screenshot using Playwright and save it to /screenshots/{job_id}/screenshot.{format}
    """
    import asyncio
    print(f"[worker] Starting take_screenshot for job_id={job_id}")
    try:
        asyncio.run(_take_screenshot(job_id, config))
        print(f"[worker] Finished take_screenshot for job_id={job_id}")
    except Exception as e:
        # Log error to job dir
        job_dir = Path('/screenshots') / job_id
        with open(job_dir / 'error.txt', 'w') as f:
            f.write(str(e))
        print(f"[worker] Exception in take_screenshot for job_id={job_id}: {e}")

async def _take_screenshot(job_id, config):
    from playwright.async_api import async_playwright
    import time
    import shutil
    print(f"[worker] _take_screenshot: job_id={job_id}, config={config}")
    job_dir = Path('/screenshots') / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    url = config.get('url')
    width = int(config.get('width', 1200))
    height = int(config.get('height', 800))
    delay = int(config.get('delay', 2))
    scale = float(config.get('scale', 1.0))
    fmt = config.get('format', 'png')
    custom_js = config.get('custom_js')
    custom_css = config.get('custom_css')
    imagemagick_script = config.get('imagemagick_script')

    screenshot_path = job_dir / f'screenshot_raw.{fmt}'
    final_path = job_dir / f'screenshot.{fmt}'

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=scale
            )
            page = await context.new_page()
            await page.goto(url)
            if custom_css:
                await page.add_style_tag(content=custom_css)
            if custom_js:
                await page.add_script_tag(content=custom_js)
            if delay > 0:
                await page.wait_for_timeout(delay * 1000)
            await page.screenshot(path=str(screenshot_path), type=fmt if fmt in ["png", "jpeg"] else "png", full_page=True)
            print(f"[worker] Screenshot saved to {screenshot_path}")
            await browser.close()
            print(f"[worker] Browser closed for job_id={job_id}")
    except Exception as e:
        with open(job_dir / 'error.txt', 'w') as f:
            f.write(f'Playwright screenshot error: {e}')
        print(f"[worker] Exception in _take_screenshot for job_id={job_id}: {e}")
        return

    # Optionally process with ImageMagick
    if imagemagick_script or scale != 1.0:
        import subprocess
        magick_cmd = ["convert", str(screenshot_path)]
        if scale != 1.0:
            magick_cmd += ["-resize", f"{int(width*scale)}x{int(height*scale)}"]
        if imagemagick_script:
            magick_cmd += imagemagick_script.split()
        magick_cmd += [str(final_path)]
        subprocess.run(magick_cmd, check=True)
    else:
        shutil.copy(str(screenshot_path), str(final_path))
    print(f"[worker] Final screenshot saved to {final_path}")
