# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build the Django Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn whitenoise

# Copy backend code
COPY backend/ .
COPY .env.example .env

# Copy built frontend assets to Django's staticfiles directory (or where whitenoise serves them)
# Note: Users usually serve frontend separately or via Django. 
# Here we assume Django serves everything or we copy build artifacts to a specific place.
# For simplicity in a single container, we'll let Django serve the frontend 
# by ensuring the React build output is in a static directory.
# ADJUSTMENT: We need to make sure Django knows where to find these files.

# Copy React build to a place where Django can collect them
COPY --from=frontend-builder /app/dist /app/static/react_build

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Run collectstatic (this might fail if DB connection is required, so we often do it at runtime or with a dummy env)
# Using a dummy secret key for build
RUN SECRET_KEY=dummy python manage.py collectstatic --noinput

# Expose port and run application
EXPOSE 8000
CMD ["gunicorn", "podvault_api.wsgi:application", "--bind", "0.0.0.0:8000"]
