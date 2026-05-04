# Multi-service container: Frontend (Nginx) + Backend (Node.js)
# Both services run in the same container using supervisord

# Stage 1: Build frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Set API URL to relative path so nginx can proxy it
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine as backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --only=production

COPY backend/ ./

# Stage 3: Final image with both services
FROM node:18-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor wget

# Create directories
RUN mkdir -p /run/nginx /var/log/supervisor /app/backend /app/frontend

# Copy backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx-combined.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1' >> /healthcheck.sh && \
    echo 'wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD ["/healthcheck.sh"]

CMD ["/entrypoint.sh"]
