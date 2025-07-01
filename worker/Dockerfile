FROM python:3.11-slim

# Install system dependencies for Playwright browsers (official method)
RUN apt-get update && \
    apt-get install -y wget gnupg2 && \
    wget -qO- https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npx playwright install-deps

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN python -m playwright install --with-deps && \
    playwright install chromium

COPY . .
CMD ["celery", "-A", "celery_app", "worker", "--loglevel=info"]
