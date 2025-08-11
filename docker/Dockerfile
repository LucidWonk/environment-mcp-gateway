FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY .env* ./

# Copy health check script
COPY docker/health-check.js ./health-check.js

# Create non-root user and directories with proper permissions
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser && \
    mkdir -p /app/.semantic-cache /app/.holistic-rollback /app/.atomic-ops /app/.holistic-ops && \
    chmod +x /app/health-check.js && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

EXPOSE 3001

# Enhanced health check with comprehensive validation
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node /app/health-check.js

CMD ["node", "dist/server.js"]