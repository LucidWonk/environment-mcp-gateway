# MCP Gateway Deployment to ubuntu-devops.lan

This document provides complete instructions for setting up automated deployment of the MCP Gateway and Bytebase to your ubuntu-devops.lan server.

## Overview

The deployment pipeline automatically:
- Builds and tests your MCP Gateway on every check-in
- Deploys to ubuntu-devops.lan
- Updates Bytebase to the latest version
- Performs health checks

## Prerequisites

### 1. Ubuntu Server Setup
Your ubuntu-devops.lan server needs:
- Docker and Docker Compose
- SSH access configured
- Network access to your local PostgreSQL database

### 2. Database Access
Configure your local PostgreSQL to accept connections from ubuntu-devops.lan:
- Update `postgresql.conf`: `listen_addresses = '*'`
- Update `pg_hba.conf`: Add line for ubuntu-devops.lan IP
- Restart PostgreSQL service

### 3. Azure DevOps Setup
- Azure DevOps project with pipeline access
- Service connection for SSH to ubuntu-devops.lan

## Step-by-Step Setup

### Step 1: Prepare ubuntu-devops.lan Server

1. **SSH to your ubuntu-devops.lan server:**
   ```bash
   ssh your-user@ubuntu-devops.lan
   ```

2. **Run the setup script:**
   ```bash
   # Copy setup script to server first
   curl -o setup-server.sh https://raw.githubusercontent.com/your-repo/devops/scripts/deploy/setup-server.sh
   chmod +x setup-server.sh
   ./setup-server.sh
   ```

3. **Log out and back in** (for Docker group permissions)

### Step 2: Configure Database Access

1. **On your local machine** (where PostgreSQL runs):
   ```bash
   # Edit PostgreSQL config
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Change: listen_addresses = 'localhost' → listen_addresses = '*'
   
   # Edit access permissions
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Add: host all all ubuntu-devops.lan-ip/32 md5
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

2. **Test connection from ubuntu-devops.lan:**
   ```bash
   psql -h your-local-ip -U postgres -d your_database
   ```

### Step 3: Configure Azure DevOps Pipeline

1. **Create SSH Service Connection:**
   - Go to Azure DevOps Project Settings → Service Connections
   - Add new SSH connection named `ubuntu-devops-ssh`
   - Host: `ubuntu-devops.lan`
   - Username: your SSH user
   - Add your SSH private key

2. **Update Pipeline Variables:**
   Edit `azure-pipelines.yml` and update:
   ```yaml
   variables:
     DEVOPS_SERVER: 'ubuntu-devops.lan'
     DEVOPS_USER: 'your-ssh-username'
   ```

3. **Create Environment:**
   - Go to Pipelines → Environments
   - Create environment named `ubuntu-devops-lan`
   - Add your server as a resource

### Step 4: Configure Environment Variables

1. **Copy and edit production environment file:**
   ```bash
   # On ubuntu-devops.lan
   cd /opt/mcp-gateway
   nano .env.production
   ```

2. **Update these key values:**
   ```bash
   DATABASE_URL=postgresql://postgres:your_password@your-local-ip:5432/your_database
   DB_PASSWORD=your_password
   ```

### Step 5: First Deployment

1. **Manual deploy for first time:**
   ```bash
   # On ubuntu-devops.lan
   cd /opt/mcp-gateway
   
   # Copy your docker-compose.production.yml and .env.production here
   # Then run:
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **Verify services:**
   ```bash
   # Check MCP Gateway
   curl http://localhost:3002/health
   
   # Check Bytebase
   curl http://localhost:8080/api/ping
   ```

### Step 6: Enable Automated Deployments

1. **Commit and push your changes** to trigger the pipeline
2. **Monitor the pipeline** in Azure DevOps
3. **Check deployment status** on ubuntu-devops.lan

## Usage Instructions

### Daily Development Workflow

1. **Make code changes** to your MCP Gateway
2. **Commit and push** to master/main branch
3. **Pipeline automatically:**
   - Builds your changes
   - Runs tests
   - Deploys to ubuntu-devops.lan if tests pass
   - Updates Bytebase to latest version

### Accessing Services

- **MCP Gateway**: `http://ubuntu-devops.lan:3002`
- **Bytebase UI**: `http://ubuntu-devops.lan:8080`

### Using Bytebase for Database Management

1. **Access Bytebase web interface**: `http://ubuntu-devops.lan:8080`
2. **First-time setup:**
   - Create admin account
   - Add your database connection
   - Configure environments (Development, QA, Production)
3. **Schema management:**
   - Design schema changes in Bytebase
   - Review and approve migrations
   - Track deployment across environments

### Monitoring and Troubleshooting

1. **Check service status:**
   ```bash
   # On ubuntu-devops.lan
   docker-compose -f /opt/mcp-gateway/docker-compose.production.yml ps
   ```

2. **View logs:**
   ```bash
   # MCP Gateway logs
   docker-compose -f /opt/mcp-gateway/docker-compose.production.yml logs environment-mcp-gateway
   
   # Bytebase logs  
   docker-compose -f /opt/mcp-gateway/docker-compose.production.yml logs bytebase
   ```

3. **Restart services if needed:**
   ```bash
   # Restart all services
   sudo systemctl restart mcp-gateway
   
   # Or restart individual services
   cd /opt/mcp-gateway
   docker-compose -f docker-compose.production.yml restart environment-mcp-gateway
   ```

## Security Considerations

1. **Database Access**: Only allow ubuntu-devops.lan IP in PostgreSQL configuration
2. **SSH Keys**: Use key-based authentication, not passwords
3. **Service Ports**: Consider firewall rules to limit access to 3002 and 8080
4. **Environment Variables**: Keep sensitive data in .env.production, not in code

## Troubleshooting Common Issues

### Pipeline Fails on SSH Connection
- Verify SSH service connection in Azure DevOps
- Check SSH key permissions and format
- Test SSH connection manually

### Services Won't Start
- Check database connectivity from ubuntu-devops.lan
- Verify .env.production configuration
- Check Docker daemon status

### Database Connection Fails
- Confirm PostgreSQL is accepting external connections
- Verify firewall rules on both servers
- Test connection with psql command

### Bytebase Won't Connect to Database
- Check DATABASE_URL format in .env.production
- Verify database user permissions
- Check Bytebase logs for specific error messages

## Support

For issues with this deployment setup, check:
1. Pipeline logs in Azure DevOps
2. Service logs on ubuntu-devops.lan
3. Network connectivity between servers
4. Database configuration and permissions