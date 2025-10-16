# Dockerfile for task-service
# Single-stage build for simplicity

FROM node:20-alpine

# Install dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared directory
COPY shared ./shared

# Copy service files
COPY services/task-service ./services/task-service

# Install dependencies (including dev dependencies for TypeScript compiler)
RUN npm install --legacy-peer-deps

# Build service
WORKDIR /app/services/task-service
RUN npx tsc

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run service
CMD ["node", "dist/services/task-service/src/index.js"]
