# =============================================================================
# Agent Builder - Frontend Dockerfile
# =============================================================================
# Multi-stage build for development (Vite) and production (Nginx)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# -----------------------------------------------------------------------------
# Stage 2: Development (Vite dev server with hot reload)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

# Add labels
LABEL org.opencontainers.image.title="Agent Builder Frontend (Development)"
LABEL org.opencontainers.image.description="LLM-based agent builder frontend - development mode with hot reload"

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configuration
COPY package.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY .eslintrc.cjs ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Set environment variables
ARG VITE_API_URL=http://localhost:3000
ARG VITE_WS_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Expose Vite dev server port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

# Start Vite dev server with host flag for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# Stage 3: Builder (Build production assets)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configuration
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=/api
ARG VITE_WS_URL=/ws
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Production (Nginx serving static files)
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

# Add labels
LABEL org.opencontainers.image.title="Agent Builder Frontend (Production)"
LABEL org.opencontainers.image.description="LLM-based agent builder frontend - production mode"
LABEL org.opencontainers.image.vendor="Agent Builder"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user nginx-user

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
