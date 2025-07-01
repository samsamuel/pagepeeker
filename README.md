# pagepeeker
Website screenshot tool


---

## 1. **System Overview**

**Goal:**
A web application that lets users input a URL and custom settings, then generates and serves a screenshot of that page, kept up to date if desired. The same image URL always returns the latest screenshot.

---

## 2. **Architecture Outline**

**Components:**

* **Frontend Web UI:**

  * React (Next.js, for SSR support and flexibility)
  * TailwindCSS (or your preferred UI lib)
  * REST/GraphQL API client

* **Backend API & Worker:**

  * FastAPI (Python) or Node.js (Express or NestJS)
  * Headless browser (Puppeteer, Playwright, or Selenium)
  * Image post-processing (ImageMagick via CLI or Wand/PythonMagick)
  * Persistent storage for screenshots (local disk or object storage like S3)
  * Scheduler/queue for auto-refresh (Celery, RQ, or Bull for Node.js)

* **Database:**

  * Postgres or SQLite (to track jobs, user configs, timestamps)

* **Containerization/Deployment:**

  * Docker for all components (multi-container setup)
  * Docker Compose for orchestration
  * Optionally, Kubernetes for production scalability

---

## 3. **Workflow Description**

1. **User inputs URL + settings** in the frontend.
2. **Frontend sends config** to the backend API.
3. **Backend schedules/generates screenshot** using headless browser:

   * Opens page at specified resolution
   * Injects custom JS/CSS if provided
   * Waits for delay, applies scale, takes screenshot
   * Runs custom ImageMagick script
   * Saves in requested format
4. **Backend saves screenshot** and updates timestamp
5. **If refresh is enabled:**

   * Background worker regenerates screenshot at interval
6. **Image is served at a stable endpoint:**

   * `/current_screen` (with optional query params for multi-user)
7. **User reloads or uses image in their apps; always gets latest**

---

## 4. **Detailed Feature Mapping**

### **Frontend**

* **Inputs:** URL, width, height, delay, scale, format, custom JS/CSS, ImageMagick script, refresh interval
* **UI:** Form with live validation, result preview, job status/progress
* **Result Page:** Displays latest screenshot and auto-refreshes if enabled

### **Backend**

* **Endpoints:**

  * `POST /screenshot`: Accepts job, returns job/image URL
  * `GET /current_screen`: Serves latest screenshot for user/job
  * `GET /job_status`: (optional) for progress polling
* **Headless Browser Control:**

  * Puppeteer/Playwright for screenshots
  * Inject custom JS/CSS after page load
  * Supports scaling (browser/devicePixelRatio)
* **Image Processing:**

  * ImageMagick CLI invoked with user script
  * Format conversion as per user selection
* **Persistence:**

  * Screenshots stored by job/user ID, overwritten on refresh
  * Database tracks jobs, configs, timestamps, errors

### **Scheduler/Worker**

* **Refresh jobs:**
  If user sets auto-refresh, backend schedules job (using a task queue) to re-run at interval

---

## 5. **Technical Stack Recommendations**

| Component        | Tech suggestion                               |
| ---------------- | --------------------------------------------- |
| Frontend         | Next.js (React), Tailwind                     |
| Backend          | FastAPI (Python) or Node.js (Express/Nest)    |
| Headless Browser | Playwright (supports Chromium/Firefox/WebKit) |
| Image Processing | ImageMagick (via CLI/subprocess)              |
| Queue/Scheduler  | Celery + Redis (Python), or BullMQ (Node.js)  |
| DB               | Postgres/SQLite                               |
| Storage          | Local disk (dev), S3/minio (prod)             |
| Containerization | Docker, Docker Compose                        |

---

## 6. **Key Design Decisions**

* **Security:**

  * Sanitize all user input (especially JS/CSS/ImageMagick scripts!)
  * Run browser/image processing in a containerized sandbox to limit risk
* **Performance:**

  * Use background jobs for long-running screenshot/processing tasks
  * Cache images for quick serving
* **Scalability:**

  * Separate API and worker containers for scaling
  * Store images in object storage in production

---

## 7. **Development Roadmap**

### **Phase 1: MVP**

* [ ] Set up monorepo with Docker Compose
* [ ] Build simple React frontend: form + screenshot display
* [ ] Implement backend endpoint for screenshot jobs
* [ ] Integrate Playwright for screenshotting, support basic settings
* [ ] Support image serving at stable URL
* [ ] Dockerize both frontend and backend

### **Phase 2: Core Features**

* [ ] Add support for custom JS/CSS injection
* [ ] Implement ImageMagick processing
* [ ] Add scheduler for auto-refresh (background worker)
* [ ] Track jobs/configs in DB

### **Phase 3: Polish & Production**

* [ ] Improve UI/UX: job progress, error messages, auto-refresh image in frontend
* [ ] Harden security: sandboxing, validation, input sanitization
* [ ] Add authentication (if multi-user)
* [ ] Switch to persistent storage (S3/minio) for images
* [ ] Add tests and monitoring

---

## 8. **Sample Data Flow Diagram**

```
User ----> [Frontend UI] ----(REST API)----> [Backend API] ---> [DB]
                                |                  |
                                v                  v
                        [Screenshot Worker]   [Image Storage]
                                |
                                v
                        [ImageMagick Processor]
                                |
                                v
                       [Served at /current_screen]
```

---

## 9. **Example API Contract**

### `POST /screenshot`

```json
{
  "url": "https://example.com",
  "width": 1200,
  "height": 800,
  "delay": 2,
  "scale": 1,
  "format": "png",
  "custom_js": "document.body.style.background = 'red';",
  "custom_css": "body { font-size: 2em; }",
  "imagemagick_script": "-resize 800x600 -blur 0x8",
  "refresh": 60
}
```

**Response:**

```json
{
  "status": "queued",
  "image_url": "/current_screen?job_id=abcd1234"
}
```

---

## 10. **Next Steps**

* Let me know your preferred tech stack (Python/Node, Playwright/Puppeteer, etc)
* I can provide:

  * Starter code (Docker Compose, API skeleton)
  * Frontend form (React component)
  * Example Playwright screenshot script
  * Sample Dockerfile(s)
* Just say which part you want to see first!

---
