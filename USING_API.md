# Using the PagePeeker API Without the Frontend

This guide explains how to interact directly with the PagePeeker backend API, bypassing the frontend. The backend is a FastAPI application running on port 8000 by default.

## Prerequisites
- The backend service must be running (see `docker-compose.yml`).
- The API is accessible at `http://localhost:8000` (or the appropriate host/port if running elsewhere).

## Common Endpoints

### 1. Health Check
- **Endpoint:** `GET /`
- **Description:** Check if the API is running.
- **Example:**
  ```bash
  curl http://localhost:8000/
  ```

### 2. Submit a Screenshot Request
- **Endpoint:** `POST /screenshot`
- **Description:** Request a screenshot of a webpage.
- **Request Body:**
  ```json
  {
    "url": "https://example.com"
  }
  ```
- **Example:**
  ```bash
  curl -X POST http://localhost:8000/screenshot \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}'
  ```
- **Response:**
  Returns a job/request ID or status.

### 3. Check Screenshot Status
- **Endpoint:** `GET /screenshot/{request_id}`
- **Description:** Get the status or result of a screenshot request.
- **Example:**
  ```bash
  curl http://localhost:8000/screenshot/<request_id>
  ```
- **Response:**
  Returns status and, if ready, a link to the screenshot.

## Authentication
If authentication is enabled, include the necessary headers or tokens as required by your deployment.

## Notes
- All endpoints and request/response formats are subject to your FastAPI implementation. Refer to the backend code for details.
- The API is designed to be used programmatically, so you can integrate it with scripts, other services, or tools like Postman.

## Example Workflow
1. Submit a screenshot request via `POST /screenshot`.
2. Poll `GET /screenshot/{request_id}` until the screenshot is ready.
3. Download or use the screenshot as needed.

---
For more details, see the backend source code in `backend/app/main.py`.
