/**
 * Service Discovery Domain
 * Automated service discovery and validation across multi-environment deployments
 */

// Core types and interfaces
export type {
    ServiceDiscoveryResult,
    DiscoveredService,
    ServiceHealthDetails,
    ServiceDiscoveryConfig,
    ServiceDiscoveryCacheEntry,
    IServiceScanner,
    IConnectivityValidator,
    ConnectivityResult,
    ServiceDiscoveryEvents
} from './types.js';

export { DEFAULT_SERVICE_DISCOVERY_CONFIG } from './types.js';

// Core engine and orchestration
export { ServiceDiscoveryEngine } from './service-discovery-engine.js';
export { ServiceScannerFactory } from './service-scanner-factory.js';
export { ServiceDiscoveryCache } from './service-discovery-cache.js';

// Connectivity validation
export { ConnectivityValidator } from './connectivity-validator.js';

// Protocol-specific scanners
export { TimescaleDBScanner } from './scanners/timescaledb-scanner.js';
export { RedPandaScanner } from './scanners/redpanda-scanner.js';
export { DockerScanner } from './scanners/docker-scanner.js';

/**
 * Service Discovery Domain Overview
 * 
 * This domain provides automated service discovery capabilities for multi-environment
 * MCP Gateway deployments. It includes:
 * 
 * - **ServiceDiscoveryEngine**: Main orchestrator for service discovery operations
 * - **Protocol-Specific Scanners**: TimescaleDB/PostgreSQL, RedPanda/Kafka, Docker daemon
 * - **Connectivity Validation**: Network connectivity testing with timeout handling
 * - **Caching Layer**: TTL-based caching for performance optimization
 * - **Health Monitoring**: Service health validation with basic functionality tests
 * 
 * Key Features:
 * - Automatic detection of database, messaging, and container services
 * - Network connectivity validation with configurable timeouts
 * - Service health validation with protocol-specific checks
 * - Discovery result caching with TTL-based invalidation
 * - Event-driven architecture for real-time notifications
 * - Integration with Environment Registry for discovery targets
 * 
 * Usage Example:
 * ```typescript
 * import { ServiceDiscoveryEngine, DEFAULT_SERVICE_DISCOVERY_CONFIG } from './service-discovery';
 * 
 * const engine = new ServiceDiscoveryEngine(DEFAULT_SERVICE_DISCOVERY_CONFIG);
 * 
 * // Discover services in an environment
 * const result = await engine.discoverEnvironmentServices(environmentConfig);
 * 
 * // Listen for service discovery events
 * engine.on('service-discovered', (event) => {
 *   console.log(`Discovered ${event.services.length} services in ${event.environmentId}`);
 * });
 * ```
 */