# Dockerfile for notification-service
# Single-stage build for simplicity

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared directory
COPY shared ./shared

# Copy service files
COPY services/notification-service ./services/notification-service

# Install dependencies (including dev dependencies for TypeScript compiler)
RUN npm install --legacy-peer-deps

# Build service
WORKDIR /app/services/notification-service
RUN npx tsc

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run service
CMD ["node", "dist/services/notification-service/src/index.js"]
