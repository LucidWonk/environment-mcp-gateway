FROM node:20-alpine

# Set container environment variables - critical for container detection
ENV CONTAINER=true
ENV DOCKER=true
ENV NODE_ENV=production
ENV MCP_SERVER_PORT=3001

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (will install correct platform binaries)
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Copy environment files and health check scripts
COPY .env* ./
COPY docker/health-check.js ./health-check.js
COPY docker/cleanup-processes.sh ./cleanup-processes.sh

# Create non-root user and directories with proper permissions
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser && \
    mkdir -p /app/.semantic-cache /app/.holistic-rollback /app/.atomic-ops /app/.holistic-ops && \
    chmod +x /app/health-check.js /app/cleanup-processes.sh && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

EXPOSE 3001

# Enhanced health check with comprehensive validation
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the MCP server in HTTP mode (container environment automatically detected)
CMD ["node", "dist/server.js"]