#!/bin/bash

# Deploy script for Pneuma Mental Wellness Application
# This script handles pulling latest code, installing dependencies, and restarting services
# Can be run manually or via GitHub Actions

set -e  # Exit on error

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_DIR="/home/azureuser/Pneuma"
VENV_PYTHON="$APP_DIR/venv/bin/python"
PIP="$APP_DIR/venv/bin/pip"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root (required for systemctl)
if [ "$EUID" -ne 0 ]; then
   log_error "This script must be run as root. Use: sudo ./deploy.sh"
   exit 1
fi

log_info "Starting deployment..."
cd "$APP_DIR"

# Step 1: Pull latest changes
log_info "Pulling latest changes from git..."
git pull origin main
if [ $? -ne 0 ]; then
    log_error "Failed to pull changes from git"
    exit 1
fi

# Step 2: Backend deployment
log_info "Deploying backend..."
cd "$APP_DIR/backend"

# Install Python dependencies
log_info "Installing Python dependencies..."
$PIP install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    log_error "Failed to install Python dependencies"
    exit 1
fi

# Create/migrate database
log_info "Initializing database..."
$VENV_PYTHON -c "from database import engine, Base; from models.db_models import *; Base.metadata.create_all(bind=engine)"
if [ $? -ne 0 ]; then
    log_error "Failed to initialize database"
    exit 1
fi

# Step 3: Frontend deployment
log_info "Deploying frontend..."
cd "$APP_DIR/frontend"

log_info "Installing npm dependencies..."
npm install --silent
if [ $? -ne 0 ]; then
    log_error "Failed to install npm dependencies"
    exit 1
fi

log_info "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    log_error "Failed to build frontend"
    exit 1
fi

# Update dist folder served by Nginx (copy to /var/www/pneuma where Nginx expects it)
log_info "Updating Nginx static files..."
sudo rm -rf /var/www/pneuma
sudo mkdir -p /var/www/pneuma
sudo cp -r dist/* /var/www/pneuma/
sudo chown -R www-data:www-data /var/www/pneuma

# Step 4: Restart services
log_info "Restarting services..."

log_info "Restarting Pneuma service (Gunicorn + FastAPI)..."
systemctl restart pneuma-backend.service
sleep 2

if ! systemctl is-active --quiet pneuma-backend.service; then
    log_error "Pneuma service failed to start"
    systemctl status pneuma-backend.service
    exit 1
fi

log_info "Restarting Nginx..."
systemctl restart nginx
sleep 1

if ! systemctl is-active --quiet nginx; then
    log_error "Nginx failed to start"
    systemctl status nginx
    exit 1
fi

# Step 5: Verify deployment
log_info "Verifying deployment..."

# Check services are running
if systemctl is-active --quiet pneuma-backend.service && systemctl is-active --quiet nginx; then
    log_info "✅ All services running"
else
    log_error "Some services failed to start"
    exit 1
fi

# Test backend API
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8003/)
if [ "$BACKEND_STATUS" = "200" ]; then
    log_info "✅ Backend API responding"
else
    log_warning "⚠️ Backend API returned status $BACKEND_STATUS"
fi

# Display logs
log_info "Recent service logs:"
journalctl -u pneuma-backend.service -n 5 --no-pager

log_info "✅ Deployment completed successfully!"
log_info "Application is live at: https://your-domain.com"
