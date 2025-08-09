FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY .env* ./

# Create non-root user and directories with proper permissions
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser && \
    mkdir -p /app/.semantic-cache /app/.holistic-rollback /app/.atomic-ops && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

EXPOSE 3001

CMD ["node", "dist/server.js"]