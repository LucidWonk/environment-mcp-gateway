#!/bin/bash
# Configure TimescaleDB container for remote access from ubuntu-devops.lan
# Run this script on your local machine where TimescaleDB is running

set -e

CONTAINER_NAME="lucidwonks-timescaledb-1"
UBUNTU_DEVOPS_IP="10.0.98.160"
WINDOWS_HOST_IP="10.0.96.0/24"

echo "=== Configuring TimescaleDB for remote access ==="

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "Error: Container $CONTAINER_NAME not found or not running"
    exit 1
fi

echo "Adding ubuntu-devops.lan ($UBUNTU_DEVOPS_IP) to allowed hosts..."

# Add remote host to pg_hba.conf
docker exec -i $CONTAINER_NAME bash << EOF
echo "host all all $UBUNTU_DEVOPS_IP/32 md5" >> /var/lib/postgresql/data/pg_hba.conf
echo "host all all $WINDOWS_HOST_IP md5" >> /var/lib/postgresql/data/pg_hba.conf
echo "Remote access configuration added for both ubuntu-devops.lan and Windows network"
EOF

echo "Restarting TimescaleDB container to apply changes..."
docker restart $CONTAINER_NAME

echo "Waiting for container to restart..."
sleep 10

# Test if container is healthy
echo "Checking container health..."
docker ps | grep $CONTAINER_NAME

echo "=== Configuration complete ==="
echo ""
echo "To test connection from ubuntu-devops.lan, run:"
echo "psql -h $(hostname -I | awk '{print $1}') -U postgres -d your_database_name"
echo ""
echo "Make sure to update your .env.production file with:"
echo "DATABASE_URL=postgresql://postgres:your_password@$(hostname -I | awk '{print $1}'):5432/your_database_name"