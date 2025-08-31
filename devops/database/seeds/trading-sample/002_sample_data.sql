-- Sample Data for MCP Gateway Testing
-- Test data for integration and performance testing

-- Sample context cache entries
INSERT INTO context_cache_metadata (cache_key, file_path, context_type, checksum) VALUES 
('src_server_ts', '/EnvironmentMCPGateway/src/server.ts', 'typescript', 'abc123def456'),
('src_tools', '/EnvironmentMCPGateway/src/tools/', 'directory', 'def456abc789'),
('tests_integration', '/EnvironmentMCPGateway.Tests/Integration/', 'test_directory', '789abc123def'),
('solution_structure', '/LucidwonksMCPGateway.sln', 'solution', '123def789abc');

-- Sample tool execution logs
CREATE TABLE IF NOT EXISTS tool_execution_logs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100),
    execution_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tool_execution_logs (tool_name, execution_time_ms, success) VALUES
('analyze-solution-structure', 1250, true),
('get-development-environment-status', 850, true), 
('trigger-context-reindex', 3200, true),
('holistic-context-update', 2100, true);

-- Performance benchmarking data
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100),
    target_time_ms INTEGER,
    actual_time_ms INTEGER,
    memory_usage_mb INTEGER,
    passed BOOLEAN,
    benchmark_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO performance_benchmarks (test_name, target_time_ms, actual_time_ms, memory_usage_mb, passed) VALUES
('context_generation_speed', 5000, 3200, 64, true),
('solution_analysis_speed', 2000, 1250, 32, true),
('tool_execution_latency', 1000, 450, 16, true);

COMMENT ON TABLE tool_execution_logs IS 'Log of MCP tool executions for testing';
COMMENT ON TABLE performance_benchmarks IS 'Performance test results and benchmarks';