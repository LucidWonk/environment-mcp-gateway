#!/bin/bash

# Deployment script for Environment MCP Gateway
# This script handles starting, stopping, and managing the containerized MCP server

set -e

COMPOSE_FILE="docker/docker-compose.yml"
PROJECT_NAME="environment-mcp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|build|clean|health}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the MCP Gateway and dependencies"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show service status"
    echo "  logs     - Show service logs (use -f for follow)"
    echo "  build    - Build the Docker images"
    echo "  clean    - Stop and remove all containers, networks, and volumes"
    echo "  health   - Check health of all services"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not running${NC}"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        exit 1
    fi
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Docker Compose file not found: $COMPOSE_FILE${NC}"
        exit 1
    fi
}

start_services() {
    echo -e "${BLUE}🚀 Starting Environment MCP Gateway...${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 5
    
    health_check
}

stop_services() {
    echo -e "${YELLOW}🛑 Stopping Environment MCP Gateway...${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
}

restart_services() {
    echo -e "${YELLOW}🔄 Restarting Environment MCP Gateway...${NC}"
    stop_services
    sleep 2
    start_services
}

show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

show_logs() {
    if [ "$2" = "-f" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=50
    fi
}

build_images() {
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build
}

clean_all() {
    echo -e "${RED}🧹 Cleaning up all containers, networks, and volumes...${NC}"
    read -p "This will remove all data. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
        echo -e "${YELLOW}⏹️  Cleanup cancelled${NC}"
    fi
}

health_check() {
    echo -e "${BLUE}🏥 Health Check:${NC}"
    
    # Check MCP Gateway
    if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
        echo -e "  MCP Gateway: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  MCP Gateway: ${RED}❌ Unhealthy${NC}"
    fi
    
    # Check host database connection via MCP container  
    if docker exec environment-mcp-gateway sh -c 'nc -z host.docker.internal 5432' >/dev/null 2>&1; then
        echo -e "  Host TimescaleDB: ${GREEN}✅ Reachable${NC}"
    else
        echo -e "  Host TimescaleDB: ${RED}❌ Unreachable${NC}"
    fi
}

# Main script logic
check_docker
check_compose_file

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    build)
        build_images
        ;;
    clean)
        clean_all
        ;;
    health)
        health_check
        ;;
    *)
        print_usage
        exit 1
        ;;
esac