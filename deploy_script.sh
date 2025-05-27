#!/bin/bash

# AI Enhanced Moving Inventory - Deployment Script
echo "🚀 Deploying AI Enhanced Moving Inventory..."

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

echo "🎯 Deploying to $ENVIRONMENT environment..."

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Run tests (if they exist)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Deploy based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "📤 Deploying to staging..."
    # Add staging deployment commands here
    # Example: rsync, scp, or cloud provider CLI commands
    
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "📤 Deploying to production..."
    
    # Build Docker images
    echo "🐳 Building Docker images..."
    docker-compose -f docker-compose.yml build
    
    # Push to registry (if using one)
    # docker-compose push
    
    # Deploy with zero downtime
    echo "⚡ Deploying with zero downtime..."
    docker-compose -f docker-compose.yml up -d
    
    # Health check
    echo "🏥 Running health checks..."
    sleep 10
    
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
        exit 1
    fi
fi

echo ""
echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo ""
echo "📊 Application URLs:"
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "Frontend: https://staging.yourapp.com"
    echo "API: https://staging-api.yourapp.com"
else
    echo "Frontend: https://yourapp.com"
    echo "API: https://api.yourapp.com"
fi
echo ""
echo "📈 Monitor the deployment:"
echo "- Health: curl https://yourapp.com/health"
echo "- Logs: docker-compose logs -f"