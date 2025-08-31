# HTTP Transport Migration - Comprehensive Deployment Strategy

## Executive Summary

This document outlines the complete deployment strategy for migrating the Lucidwonks EnvironmentMCPGateway from STDIO-based MCP transport to HTTP/SSE transport. The strategy addresses infrastructure requirements identified by the Virtual Expert Team across architecture, context engineering, performance, quality assurance, and process engineering domains.

## Infrastructure Assessment

### Current State Analysis
- **Transport**: STDIO-based MCP server with StdioServerTransport
- **Infrastructure**: Docker-based with TimescaleDB, RedPanda, and health server
- **Architecture**: Single-service MCP Gateway with adapter pattern
- **Persistence**: Local volumes for cache, atomic operations, and rollback data
- **Networking**: Bridge network with host-gateway integration

### Target State Requirements
- **HTTP/SSE Transport**: Real-time bidirectional communication
- **Session Management**: Persistent shared state across client connections
- **Distributed Coordination**: Redis cluster for session state, Context Engineering persistence
- **Horizontal Scaling**: Load balancing capability with service mesh
- **Enhanced Monitoring**: Comprehensive observability and metrics collection

## Phase 1: Infrastructure Foundation (Weeks 1-2)

### 1.1 Redis Cluster Deployment

#### Primary Redis Cluster Configuration
```yaml
# docker-compose.redis.yml
version: '3.8'

services:
  redis-master:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-redis_secure_password}
    ports:
      - "6379:6379"
    volumes:
      - redis_master_data:/data
    networks:
      - lucid-network
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD:-redis_secure_password}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  redis-replica-1:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru --replicaof redis-master 6379 --masterauth ${REDIS_PASSWORD}
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-redis_secure_password}
    ports:
      - "6380:6379"
    volumes:
      - redis_replica1_data:/data
    networks:
      - lucid-network
    depends_on:
      - redis-master
    restart: unless-stopped

  redis-replica-2:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru --replicaof redis-master 6379 --masterauth ${REDIS_PASSWORD}
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-redis_secure_password}
    ports:
      - "6381:6379"
    volumes:
      - redis_replica2_data:/data
    networks:
      - lucid-network
    depends_on:
      - redis-master
    restart: unless-stopped

  redis-sentinel-1:
    image: redis:7.2-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    ports:
      - "26379:26379"
    volumes:
      - ./redis/sentinel-1.conf:/etc/redis/sentinel.conf:ro
    networks:
      - lucid-network
    depends_on:
      - redis-master
    restart: unless-stopped

  redis-sentinel-2:
    image: redis:7.2-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    ports:
      - "26380:26379"
    volumes:
      - ./redis/sentinel-2.conf:/etc/redis/sentinel.conf:ro
    networks:
      - lucid-network
    depends_on:
      - redis-master
    restart: unless-stopped

  redis-sentinel-3:
    image: redis:7.2-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    ports:
      - "26381:26379"
    volumes:
      - ./redis/sentinel-3.conf:/etc/redis/sentinel.conf:ro
    networks:
      - lucid-network
    depends_on:
      - redis-master
    restart: unless-stopped

volumes:
  redis_master_data:
  redis_replica1_data:
  redis_replica2_data:

networks:
  lucid-network:
    external: true
```

#### Redis Sentinel Configuration Template
```bash
# redis/sentinel-1.conf
port 26379
sentinel monitor lucid-redis redis-master 6379 2
sentinel auth-pass lucid-redis ${REDIS_PASSWORD}
sentinel down-after-milliseconds lucid-redis 30000
sentinel parallel-syncs lucid-redis 1
sentinel failover-timeout lucid-redis 180000
sentinel deny-scripts-reconfig yes
```

### 1.2 Enhanced TimescaleDB Configuration

#### Context Engineering Persistence Schema
```sql
-- Database schema for Context Engineering persistence
-- Run after TimescaleDB initialization

-- Context sessions table
CREATE TABLE IF NOT EXISTS context_sessions (
    session_id UUID PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    session_data JSONB,
    status VARCHAR(50) DEFAULT 'active'
);

-- Context operations table
CREATE TABLE IF NOT EXISTS context_operations (
    operation_id UUID PRIMARY KEY,
    session_id UUID REFERENCES context_sessions(session_id),
    operation_type VARCHAR(100) NOT NULL,
    operation_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Hypertable for context operations (time-series optimization)
SELECT create_hypertable('context_operations', 'created_at', if_not_exists => TRUE);

-- Distributed coordination state
CREATE TABLE IF NOT EXISTS coordination_state (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    version BIGINT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_context_sessions_client_id ON context_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_context_sessions_status ON context_sessions(status);
CREATE INDEX IF NOT EXISTS idx_context_operations_session_id ON context_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_context_operations_status ON context_operations(status);
CREATE INDEX IF NOT EXISTS idx_coordination_state_expires ON coordination_state(expires_at);

-- Cleanup expired sessions procedure
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Delete expired sessions (older than 24 hours)
    DELETE FROM context_sessions 
    WHERE last_accessed < NOW() - INTERVAL '24 hours';
    
    -- Delete expired coordination state
    DELETE FROM coordination_state 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every hour
SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');
```

### 1.3 Load Balancer Configuration

#### NGINX Load Balancer Setup
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream mcp_gateway_backend {
        least_conn;
        server environment-mcp-gateway-1:3001 max_fails=3 fail_timeout=30s;
        server environment-mcp-gateway-2:3001 max_fails=3 fail_timeout=30s;
        server environment-mcp-gateway-3:3001 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Health check endpoint
    upstream mcp_gateway_health {
        server environment-mcp-gateway-1:3001;
        server environment-mcp-gateway-2:3001 backup;
        server environment-mcp-gateway-3:3001 backup;
    }

    server {
        listen 80;
        server_name localhost;

        # Health check endpoint
        location /health {
            proxy_pass http://mcp_gateway_health/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn addr 10;

            proxy_pass http://mcp_gateway_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # HTTP/SSE specific settings
            proxy_buffering off;
            proxy_cache off;
            proxy_set_header Connection '';
            proxy_http_version 1.1;
            chunked_transfer_encoding off;

            # Timeouts for long-lived connections
            proxy_connect_timeout 60s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        # WebSocket/SSE upgrade
        location /sse/ {
            proxy_pass http://mcp_gateway_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache off;
            proxy_buffering off;
        }
    }
}
```

## Phase 2: HTTP Transport Implementation (Weeks 3-4)

### 2.1 HTTP Server Architecture

#### Enhanced HTTP Server with SSE Support
```typescript
// src/http-server.ts
import http from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'crypto';

export interface SessionContext {
    sessionId: string;
    clientId: string;
    createdAt: Date;
    lastAccessed: Date;
    metadata: Record<string, any>;
}

export class HttpMcpServer extends EventEmitter {
    private server: http.Server;
    private sessions: Map<string, SessionContext> = new Map();
    private sseConnections: Map<string, http.ServerResponse> = new Map();
    
    constructor(private port: number = 3001) {
        super();
        this.server = this.createServer();
        this.setupCleanupInterval();
    }

    private createServer(): http.Server {
        return http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID, X-Client-ID');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            switch (url.pathname) {
                case '/api/session/create':
                    await this.handleSessionCreate(req, res);
                    break;
                case '/api/session/validate':
                    await this.handleSessionValidate(req, res);
                    break;
                case '/api/mcp/tools':
                    await this.handleToolsList(req, res);
                    break;
                case '/api/mcp/call':
                    await this.handleToolCall(req, res);
                    break;
                case '/sse/events':
                    await this.handleSSEConnection(req, res);
                    break;
                case '/health':
                    await this.handleHealthCheck(req, res);
                    break;
                default:
                    this.sendError(res, 404, 'Not Found');
            }
        } catch (error) {
            console.error('Request handling error:', error);
            this.sendError(res, 500, 'Internal Server Error');
        }
    }

    private async handleSessionCreate(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const body = await this.readRequestBody(req);
        const { clientId, metadata = {} } = JSON.parse(body);

        const sessionId = randomUUID();
        const session: SessionContext = {
            sessionId,
            clientId,
            createdAt: new Date(),
            lastAccessed: new Date(),
            metadata
        };

        this.sessions.set(sessionId, session);
        
        // Store session in Redis for distributed access
        await this.storeSessionInRedis(session);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            sessionId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }));
    }

    private async handleSSEConnection(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const sessionId = req.headers['x-session-id'] as string;
        
        if (!sessionId || !this.sessions.has(sessionId)) {
            this.sendError(res, 401, 'Invalid session');
            return;
        }

        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Send initial connection event
        this.sendSSEMessage(res, 'connected', { sessionId, timestamp: Date.now() });

        // Store connection for broadcasting
        this.sseConnections.set(sessionId, res);

        // Handle connection close
        req.on('close', () => {
            this.sseConnections.delete(sessionId);
        });

        // Keep connection alive
        const keepAliveInterval = setInterval(() => {
            this.sendSSEMessage(res, 'keepalive', { timestamp: Date.now() });
        }, 30000);

        req.on('close', () => {
            clearInterval(keepAliveInterval);
        });
    }

    private sendSSEMessage(res: http.ServerResponse, event: string, data: any): void {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    private async storeSessionInRedis(session: SessionContext): Promise<void> {
        // Implementation depends on Redis client setup
        // This would store session data in Redis with expiration
    }

    private setupCleanupInterval(): void {
        setInterval(() => {
            const now = Date.now();
            const expiredSessions: string[] = [];

            for (const [sessionId, session] of this.sessions) {
                if (now - session.lastAccessed.getTime() > 24 * 60 * 60 * 1000) {
                    expiredSessions.push(sessionId);
                }
            }

            expiredSessions.forEach(sessionId => {
                this.sessions.delete(sessionId);
                this.sseConnections.delete(sessionId);
            });
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, '0.0.0.0', () => {
                console.log(`HTTP MCP Server listening on port ${this.port}`);
                resolve();
            });

            this.server.on('error', reject);
        });
    }
}
```

### 2.2 Session Management Infrastructure

#### Redis Session Manager
```typescript
// src/infrastructure/session-manager.ts
import Redis from 'ioredis';
import { SessionContext } from '../http-server.js';

export class SessionManager {
    private redis: Redis;
    private readonly SESSION_PREFIX = 'mcp:session:';
    private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

    constructor(redisConfig: Redis.RedisOptions) {
        this.redis = new Redis(redisConfig);
    }

    async createSession(session: SessionContext): Promise<void> {
        const key = `${this.SESSION_PREFIX}${session.sessionId}`;
        await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
        
        // Index by client ID for lookup
        await this.redis.sadd(`mcp:client:${session.clientId}:sessions`, session.sessionId);
    }

    async getSession(sessionId: string): Promise<SessionContext | null> {
        const key = `${this.SESSION_PREFIX}${sessionId}`;
        const data = await this.redis.get(key);
        
        if (!data) return null;
        
        const session = JSON.parse(data) as SessionContext;
        
        // Update last accessed time
        session.lastAccessed = new Date();
        await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
        
        return session;
    }

    async deleteSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (session) {
            await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
            await this.redis.srem(`mcp:client:${session.clientId}:sessions`, sessionId);
        }
    }

    async getClientSessions(clientId: string): Promise<string[]> {
        return this.redis.smembers(`mcp:client:${clientId}:sessions`);
    }

    async cleanupExpiredSessions(): Promise<number> {
        // This would be handled by Redis TTL, but we can also implement
        // manual cleanup for additional housekeeping
        const pattern = `${this.SESSION_PREFIX}*`;
        let cursor = '0';
        let cleanedCount = 0;

        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern);
            cursor = nextCursor;

            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl < 0) {
                    await this.redis.del(key);
                    cleanedCount++;
                }
            }
        } while (cursor !== '0');

        return cleanedCount;
    }
}
```

## Phase 3: Service Mesh and Orchestration (Weeks 5-6)

### 3.1 Docker Compose Orchestration

#### Main Docker Compose Configuration
```yaml
# docker-compose.http-migration.yml
version: '3.8'

services:
  # Load Balancer
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - lucid-network
    depends_on:
      - environment-mcp-gateway-1
      - environment-mcp-gateway-2
      - environment-mcp-gateway-3
    restart: unless-stopped
    labels:
      - "com.lucidwonks.service=load-balancer"
      - "com.lucidwonks.tier=frontend"

  # MCP Gateway Instances (3 for high availability)
  environment-mcp-gateway-1:
    build:
      context: ..
      dockerfile: docker/Dockerfile.http
    container_name: environment-mcp-gateway-1
    environment:
      - NODE_ENV=production
      - MCP_SERVER_PORT=3001
      - MCP_TRANSPORT=http
      - INSTANCE_ID=1
      - REDIS_URL=redis://redis-master:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@timescaledb:5432/pricehistorydb
      - SESSION_STORE=redis
      - ENABLE_SSE=true
    volumes:
      - mcp_cache_1:/app/.semantic-cache
      - mcp_rollback_1:/app/.holistic-rollback
      - mcp_atomic_1:/app/.atomic-ops
    networks:
      - lucid-network
    depends_on:
      - redis-master
      - timescaledb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  environment-mcp-gateway-2:
    build:
      context: ..
      dockerfile: docker/Dockerfile.http
    container_name: environment-mcp-gateway-2
    environment:
      - NODE_ENV=production
      - MCP_SERVER_PORT=3001
      - MCP_TRANSPORT=http
      - INSTANCE_ID=2
      - REDIS_URL=redis://redis-master:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@timescaledb:5432/pricehistorydb
      - SESSION_STORE=redis
      - ENABLE_SSE=true
    volumes:
      - mcp_cache_2:/app/.semantic-cache
      - mcp_rollback_2:/app/.holistic-rollback
      - mcp_atomic_2:/app/.atomic-ops
    networks:
      - lucid-network
    depends_on:
      - redis-master
      - timescaledb
    restart: unless-stopped

  environment-mcp-gateway-3:
    build:
      context: ..
      dockerfile: docker/Dockerfile.http
    container_name: environment-mcp-gateway-3
    environment:
      - NODE_ENV=production
      - MCP_SERVER_PORT=3001
      - MCP_TRANSPORT=http
      - INSTANCE_ID=3
      - REDIS_URL=redis://redis-master:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@timescaledb:5432/pricehistorydb
      - SESSION_STORE=redis
      - ENABLE_SSE=true
    volumes:
      - mcp_cache_3:/app/.semantic-cache
      - mcp_rollback_3:/app/.holistic-rollback
      - mcp_atomic_3:/app/.atomic-ops
    networks:
      - lucid-network
    depends_on:
      - redis-master
      - timescaledb
    restart: unless-stopped

  # Monitoring and Observability
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - lucid-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - lucid-network
    depends_on:
      - prometheus
    restart: unless-stopped

  # Log aggregation
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    networks:
      - lucid-network
    restart: unless-stopped

volumes:
  mcp_cache_1:
  mcp_cache_2:
  mcp_cache_3:
  mcp_rollback_1:
  mcp_rollback_2:
  mcp_rollback_3:
  mcp_atomic_1:
  mcp_atomic_2:
  mcp_atomic_3:
  prometheus_data:
  grafana_data:
  loki_data:

networks:
  lucid-network:
    name: lucid-network
    external: true
```

### 3.2 Monitoring and Observability

#### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'mcp-gateway'
    static_configs:
      - targets: 
        - 'environment-mcp-gateway-1:3001'
        - 'environment-mcp-gateway-2:3001'
        - 'environment-mcp-gateway-3:3001'
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'redis'
    static_configs:
      - targets: 
        - 'redis-master:6379'
        - 'redis-replica-1:6379'
        - 'redis-replica-2:6379'

  - job_name: 'timescaledb'
    static_configs:
      - targets: ['timescaledb:5432']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-lb:80']
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "id": null,
    "title": "MCP Gateway HTTP Migration Dashboard",
    "tags": ["mcp", "http", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Sessions",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(mcp_active_sessions)",
            "legendFormat": "Active Sessions"
          }
        ]
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "id": 4,
        "title": "SSE Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(mcp_sse_connections)",
            "legendFormat": "SSE Connections"
          }
        ]
      },
      {
        "id": 5,
        "title": "Redis Operations",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(redis_commands_processed_total[5m])",
            "legendFormat": "Commands/sec"
          }
        ]
      },
      {
        "id": 6,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          },
          {
            "expr": "rate(http_requests_total{status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

## Phase 4: Quality Assurance and Testing (Weeks 7-8)

### 4.1 Comprehensive Testing Strategy

#### Integration Testing Suite
```typescript
// tests/integration/http-transport.test.ts
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import fetch from 'node-fetch';
import { EventSource } from 'eventsource';

describe('HTTP Transport Integration Tests', () => {
    const baseUrl = 'http://localhost:3001';
    let sessionId: string;

    beforeAll(async () => {
        // Create test session
        const response = await fetch(`${baseUrl}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: 'test-client' })
        });
        const session = await response.json();
        sessionId = session.sessionId;
    });

    describe('Session Management', () => {
        it('should create a valid session', async () => {
            expect(sessionId).toBeDefined();
            expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should validate existing session', async () => {
            const response = await fetch(`${baseUrl}/api/session/validate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                }
            });
            expect(response.ok).toBe(true);
        });
    });

    describe('MCP Tool Operations', () => {
        it('should list available tools', async () => {
            const response = await fetch(`${baseUrl}/api/mcp/tools`, {
                headers: { 'X-Session-ID': sessionId }
            });
            const data = await response.json();
            
            expect(response.ok).toBe(true);
            expect(data.tools).toBeInstanceOf(Array);
            expect(data.tools.length).toBeGreaterThan(0);
        });

        it('should execute tool call', async () => {
            const response = await fetch(`${baseUrl}/api/mcp/call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                },
                body: JSON.stringify({
                    name: 'get-development-environment-status',
                    arguments: {}
                })
            });
            
            expect(response.ok).toBe(true);
            const result = await response.json();
            expect(result.content).toBeDefined();
        });
    });

    describe('SSE Event Stream', () => {
        it('should establish SSE connection', (done) => {
            const eventSource = new EventSource(`${baseUrl}/sse/events`, {
                headers: { 'X-Session-ID': sessionId }
            });

            eventSource.onopen = () => {
                eventSource.close();
                done();
            };

            eventSource.onerror = (error) => {
                eventSource.close();
                done(error);
            };
        });

        it('should receive events over SSE', (done) => {
            const eventSource = new EventSource(`${baseUrl}/sse/events`, {
                headers: { 'X-Session-ID': sessionId }
            });

            const receivedEvents: any[] = [];

            eventSource.addEventListener('connected', (event) => {
                receivedEvents.push(JSON.parse(event.data));
            });

            setTimeout(() => {
                eventSource.close();
                expect(receivedEvents.length).toBeGreaterThan(0);
                expect(receivedEvents[0].sessionId).toBe(sessionId);
                done();
            }, 1000);
        });
    });
});
```

#### Load Testing Configuration
```yaml
# tests/load/locustfile.py
from locust import HttpUser, task, between
import json
import uuid

class MCPGatewayUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Create session
        response = self.client.post("/api/session/create", json={
            "clientId": f"load-test-{uuid.uuid4()}"
        })
        self.session_data = response.json()
        self.session_id = self.session_data["sessionId"]
    
    @task(3)
    def list_tools(self):
        self.client.get("/api/mcp/tools", headers={
            "X-Session-ID": self.session_id
        })
    
    @task(2)
    def call_tool(self):
        self.client.post("/api/mcp/call", 
            json={
                "name": "get-development-environment-status",
                "arguments": {}
            },
            headers={
                "X-Session-ID": self.session_id,
                "Content-Type": "application/json"
            }
        )
    
    @task(1)
    def health_check(self):
        self.client.get("/health")

# Run with: locust -f locustfile.py --host=http://localhost:3001
```

### 4.2 Automated Testing Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/http-migration-tests.yml
name: HTTP Migration Testing

on:
  push:
    branches: [ main, http-migration ]
  pull_request:
    branches: [ main ]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7.2-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      timescaledb:
        image: timescale/timescaledb-ha:pg16
        env:
          POSTGRES_PASSWORD: password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'EnvironmentMCPGateway/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd EnvironmentMCPGateway
        npm ci
    
    - name: Build application
      run: |
        cd EnvironmentMCPGateway
        npm run build
    
    - name: Start HTTP server
      run: |
        cd EnvironmentMCPGateway
        npm start &
        sleep 10
      env:
        MCP_TRANSPORT: http
        REDIS_URL: redis://localhost:6379
        DATABASE_URL: postgresql://postgres:password@localhost:5432/postgres
    
    - name: Run integration tests
      run: |
        cd EnvironmentMCPGateway
        npm test
    
    - name: Run load tests
      run: |
        pip install locust
        cd EnvironmentMCPGateway/tests/load
        locust -f locustfile.py --host=http://localhost:3001 --headless -u 10 -r 2 -t 60s

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'repo'
        scan-ref: 'EnvironmentMCPGateway'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
```

## Phase 5: Deployment and Rollback Procedures (Weeks 9-10)

### 5.1 Blue-Green Deployment Strategy

#### Deployment Script
```bash
#!/bin/bash
# deploy-http-migration.sh

set -euo pipefail

DEPLOYMENT_ENV="${1:-staging}"
VERSION="${2:-latest}"
ROLLBACK_VERSION="${3:-}"

echo "🚀 Starting HTTP Migration Deployment"
echo "Environment: $DEPLOYMENT_ENV"
echo "Version: $VERSION"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required services are healthy
    if ! docker-compose -f docker-compose.yml ps | grep -q "Up"; then
        error "Required services are not running"
    fi
    
    # Check Redis connectivity
    if ! docker exec redis-master redis-cli ping | grep -q "PONG"; then
        error "Redis is not accessible"
    fi
    
    # Check TimescaleDB connectivity
    if ! docker exec timescaledb pg_isready | grep -q "accepting connections"; then
        error "TimescaleDB is not accessible"
    fi
    
    # Validate configuration
    if [[ ! -f ".env.${DEPLOYMENT_ENV}" ]]; then
        error "Environment file .env.${DEPLOYMENT_ENV} not found"
    fi
    
    log "Pre-deployment checks passed"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Apply Context Engineering schema
    docker exec timescaledb psql -U postgres -f /migrations/context-engineering-schema.sql
    
    # Verify migration success
    if ! docker exec timescaledb psql -U postgres -c "\dt" | grep -q "context_sessions"; then
        error "Database migration failed"
    fi
    
    log "Database migrations completed"
}

# Blue-green deployment
deploy_blue_green() {
    log "Starting blue-green deployment..."
    
    # Determine current and next environments
    CURRENT_ENV=$(docker ps --format "table {{.Names}}" | grep "environment-mcp-gateway" | head -1 | sed 's/.*-//')
    NEXT_ENV=$([[ "$CURRENT_ENV" == "blue" ]] && echo "green" || echo "blue")
    
    log "Current environment: $CURRENT_ENV"
    log "Deploying to: $NEXT_ENV"
    
    # Build new image
    docker-compose -f docker-compose.http-migration.yml build \
        --build-arg VERSION=$VERSION \
        environment-mcp-gateway-${NEXT_ENV}
    
    # Start new environment
    docker-compose -f docker-compose.http-migration.yml up -d \
        environment-mcp-gateway-${NEXT_ENV}
    
    # Wait for health check
    local retries=0
    local max_retries=30
    while [[ $retries -lt $max_retries ]]; do
        if curl -f "http://localhost:3001/health" &>/dev/null; then
            log "Health check passed"
            break
        fi
        ((retries++))
        sleep 10
    done
    
    if [[ $retries -eq $max_retries ]]; then
        error "Health check failed after $max_retries attempts"
    fi
    
    # Run smoke tests
    if ! run_smoke_tests; then
        error "Smoke tests failed"
    fi
    
    # Switch load balancer
    update_load_balancer "$NEXT_ENV"
    
    # Stop old environment
    docker-compose -f docker-compose.http-migration.yml stop \
        environment-mcp-gateway-${CURRENT_ENV}
    
    log "Blue-green deployment completed successfully"
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Test session creation
    local session_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"clientId":"smoke-test"}' \
        http://localhost:3001/api/session/create)
    
    local session_id=$(echo "$session_response" | jq -r '.sessionId')
    
    if [[ "$session_id" == "null" ]]; then
        error "Session creation test failed"
    fi
    
    # Test tool listing
    local tools_response=$(curl -s \
        -H "X-Session-ID: $session_id" \
        http://localhost:3001/api/mcp/tools)
    
    if ! echo "$tools_response" | jq -e '.tools | length > 0' &>/dev/null; then
        error "Tool listing test failed"
    fi
    
    # Test SSE connection
    if ! timeout 10 curl -N -H "X-Session-ID: $session_id" \
        http://localhost:3001/sse/events | grep -q "connected"; then
        error "SSE connection test failed"
    fi
    
    log "Smoke tests passed"
    return 0
}

# Update load balancer configuration
update_load_balancer() {
    local target_env="$1"
    log "Updating load balancer to target: $target_env"
    
    # Update nginx configuration
    sed -i "s/environment-mcp-gateway-[^:]*:/environment-mcp-gateway-${target_env}:/g" \
        nginx/nginx.conf
    
    # Reload nginx
    docker exec nginx-lb nginx -s reload
    
    log "Load balancer updated"
}

# Rollback function
rollback_deployment() {
    if [[ -z "$ROLLBACK_VERSION" ]]; then
        error "Rollback version not specified"
    fi
    
    warn "Rolling back to version: $ROLLBACK_VERSION"
    
    # Restore previous configuration
    git checkout "$ROLLBACK_VERSION" -- nginx/nginx.conf
    docker exec nginx-lb nginx -s reload
    
    # Start previous version containers
    docker-compose -f docker-compose.yml up -d \
        environment-mcp-gateway-${ROLLBACK_VERSION}
    
    log "Rollback completed"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "deploy")
            pre_deployment_checks
            run_migrations
            deploy_blue_green
            ;;
        "rollback")
            rollback_deployment
            ;;
        *)
            echo "Usage: $0 [deploy|rollback] [environment] [version] [rollback_version]"
            exit 1
            ;;
    esac
}

# Trap errors and cleanup
trap 'error "Deployment failed at line $LINENO"' ERR

main "$@"
```

### 5.2 Monitoring and Alerting

#### Prometheus Alert Rules
```yaml
# monitoring/alert_rules.yml
groups:
  - name: mcp_gateway_alerts
    rules:
      - alert: MCPGatewayDown
        expr: up{job="mcp-gateway"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MCP Gateway instance {{ $labels.instance }} is down"
          description: "MCP Gateway has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} requests per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: RedisConnectionFailure
        expr: redis_connected_clients == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Redis connection failure"
          description: "No clients connected to Redis"

      - alert: SessionStoreUnavailable
        expr: absent(redis_up)
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Session store unavailable"
          description: "Redis session store is not responding"
```

## Risk Mitigation and Contingency Planning

### High-Risk Scenarios and Mitigation

1. **Session Data Loss**
   - **Risk**: Redis failure causing session loss
   - **Mitigation**: Redis Sentinel for high availability, backup to TimescaleDB
   - **Contingency**: Graceful degradation to stateless mode

2. **Database Migration Failure**
   - **Risk**: Context Engineering schema migration issues
   - **Mitigation**: Comprehensive backup before migration, rollback scripts
   - **Contingency**: Revert to previous schema with data consistency checks

3. **Load Balancer Configuration Error**
   - **Risk**: Incorrect routing causing service disruption
   - **Mitigation**: Configuration validation, staged rollout
   - **Contingency**: Direct service access bypassing load balancer

4. **Performance Degradation**
   - **Risk**: HTTP overhead causing slower response times
   - **Mitigation**: Connection pooling, caching layers, horizontal scaling
   - **Contingency**: Resource scaling, circuit breaker patterns

### Success Metrics and KPIs

1. **Availability**: 99.9% uptime target
2. **Performance**: <500ms average response time
3. **Scalability**: Support 1000+ concurrent sessions
4. **Reliability**: <0.1% error rate
5. **Recovery**: <5 minute RTO (Recovery Time Objective)

## Implementation Timeline

| Phase | Duration | Key Milestones | Dependencies |
|-------|----------|----------------|--------------|
| Phase 1 | 2 weeks | Redis cluster, enhanced TimescaleDB | Infrastructure team |
| Phase 2 | 2 weeks | HTTP server, session management | Architecture design approval |
| Phase 3 | 2 weeks | Service mesh, monitoring | Ops team coordination |
| Phase 4 | 2 weeks | Testing suite, load testing | QA team engagement |
| Phase 5 | 2 weeks | Deployment, rollback procedures | Change management approval |

## Conclusion

This deployment strategy provides a comprehensive approach to migrating the EnvironmentMCPGateway from STDIO to HTTP transport while addressing all infrastructure requirements identified by the Virtual Expert Team. The phased approach ensures minimal disruption while building robust, scalable infrastructure capable of supporting distributed Context Engineering operations and horizontal scaling requirements.

The strategy emphasizes observability, testing, and rollback capabilities to ensure safe deployment and operation of the HTTP transport migration.