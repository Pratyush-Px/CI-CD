# ==============================================================================
# Production Dockerfile for StudentHub - Student Management System
# Base image: Official Node.js 20 LTS on Alpine Linux for lightweight, secure footprint
# ==============================================================================
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies first (leveraging Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application code and static frontend files
COPY server.js ./
COPY public/ ./public/

# Switch to non-root user provided by node alpine image for enhanced security
USER node

# Expose HTTP port
EXPOSE 3000

# Start application using package start script
CMD ["npm", "start"]
