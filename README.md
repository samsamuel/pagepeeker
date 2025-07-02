
# pagepeeker
Website screenshot tool

---

## 🚀 Quickstart: Deploy & Use PagePeeker

### 1. Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed
- (Optional) [git](https://git-scm.com/) if you want to clone the repo

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd pagepeeker
```

### 3. Build & Start All Services

```bash
docker-compose up --build
```

This will start:
- **Frontend** (Next.js, port 3000)
- **Backend API** (FastAPI, port 8000)
- **Worker** (Celery)
- **Scheduler** (Celery Beat)
- **Redis** (for queue)
- **Postgres** (for jobs/configs)
- **Nginx** (reverse proxy, ports 80/443)

You can access:
- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)
- Nginx: [http://localhost](http://localhost)

### 4. Using the API Directly

You can use the backend API without the frontend. See [`USING_API.md`](./USING_API.md) for endpoint details and example `curl` commands.

### 5. Stopping the Services

```bash
docker-compose down
```

---
