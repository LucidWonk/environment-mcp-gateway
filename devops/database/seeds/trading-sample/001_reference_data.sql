-- Reference Data for MCP Gateway Testing
-- Sample data for context engineering and testing

-- Sample MCP tools registry
CREATE TABLE IF NOT EXISTS mcp_tools_registry (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    tool_description TEXT,
    tool_category VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO mcp_tools_registry (tool_name, tool_description, tool_category) VALUES 
('analyze-solution-structure', 'Analyze .NET solution structure and dependencies', 'analysis'),
('get-development-environment-status', 'Get comprehensive development environment status', 'environment'),
('trigger-context-reindex', 'Trigger full context reindexing', 'context'),
('holistic-context-update', 'Execute holistic context updates', 'context');

-- Sample context cache metadata
CREATE TABLE IF NOT EXISTS context_cache_metadata (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    file_path TEXT,
    last_modified TIMESTAMP,
    checksum VARCHAR(64),
    context_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mcp_tools_registry IS 'Registry of available MCP tools for testing';
COMMENT ON TABLE context_cache_metadata IS 'Metadata for context cache entries';