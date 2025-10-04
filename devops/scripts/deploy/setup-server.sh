#!/bin/bash
# Initial setup script for ubuntu-devops.lan server
# Run this once to prepare the server for deployments

set -e

echo "=== Setting up ubuntu-devops.lan for MCP Gateway deployment ==="

# Create deployment directory
sudo mkdir -p /opt/mcp-gateway
sudo chown $USER:$USER /opt/mcp-gateway

# Create logs directory
mkdir -p /opt/mcp-gateway/logs

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed. Please log out and back in for group changes to take effect."
fi

# Install curl for health checks
sudo apt update
sudo apt install -y curl

# Create systemd service for auto-start
cat << 'EOF' | sudo tee /etc/systemd/system/mcp-gateway.service
[Unit]
Description=MCP Gateway DevOps Environment
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/mcp-gateway
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl enable mcp-gateway.service

echo "=== Server setup complete ==="
echo "Next steps:"
echo "1. Copy deployment files to /opt/mcp-gateway"
echo "2. Update .env.production with your database details"
echo "3. Configure Azure DevOps pipeline with SSH connection"
echo "4. Run your first deployment!"