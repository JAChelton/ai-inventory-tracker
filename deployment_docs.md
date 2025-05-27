# Deployment Guide

## Quick Start with Docker

The fastest way to deploy the application is using Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/ai-inventory-tracker.git
cd ai-inventory-tracker

# 2. Set up environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# 3. Start with Docker
docker-compose up -d

# 4. Check health
curl http://localhost/health
```

## Environment Variables

### Required
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

### Optional
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Google Search (optional enhancement)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CX=your-custom-search-engine-id

# Rate Limiting
RATE_LIMIT_POINTS=10
RATE_LIMIT_DURATION=60

# Cache Configuration
CACHE_TTL=86400
```

## Production Deployment Options

### 1. Docker + Docker Compose (Recommended)

**Pros:**
- Easy to deploy and scale
- Consistent environment
- Built-in reverse proxy
- Health checks included

**Setup:**
```bash
# Production docker-compose
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### 2. Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key-here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Vercel (Serverless)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod
```

#### AWS ECS/EKS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

docker build -t ai-inventory-backend .
docker tag ai-inventory-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/ai-inventory-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/ai-inventory-backend:latest
```

### 3. VPS/Dedicated Server

#### Ubuntu/Debian Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/yourusername/ai-inventory-tracker.git
cd ai-inventory-tracker
npm install
cd frontend && npm install && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js

# Setup PM2 startup
pm2 startup
pm2 save
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'ai-inventory-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

#### Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/ai-inventory
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/ai-inventory/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL/HTTPS Setup

### Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom Certificate
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # ... rest of config
}
```

## Database Setup (Optional)

### Redis for Caching
```bash
# Install Redis
sudo apt install redis-server

# Configure
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Update backend to use Redis
npm install redis
```

### PostgreSQL for Persistence
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb ai_inventory

# Create user
sudo -u postgres createuser --interactive
```

## Monitoring & Logging

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs

# System resources
htop
```

### Log Management
```bash
# Centralized logging with Winston
npm install winston

# Log rotation
sudo logrotate -d /etc/logrotate.d/ai-inventory
```

### Health Checks
```bash
# Simple health check script
#!/bin/bash
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API healthy"
else
    echo "❌ API unhealthy"
    # Restart service or send alert
fi
```

## Performance Optimization

### Caching Strategy
- **Redis:** API responses, web search results
- **CDN:** Static assets, images
- **Browser:** CSS, JS with proper cache headers

### Load Balancing
```yaml
# docker-compose with multiple backends
version: '3.8'
services:
  backend1:
    build: .
    environment:
      - PORT=3001
  backend2:
    build: .
    environment:
      - PORT=3002
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - backend1
      - backend2
```

### Database Optimization
- **Indexing:** On frequently queried fields
- **Connection pooling:** Limit concurrent connections
- **Query optimization:** Use explain plans

## Security Checklist

### Application Security
- [ ] Environment variables secured
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers added (Helmet.js)

### Infrastructure Security
- [ ] Firewall configured (UFW/iptables)
- [ ] SSH key authentication only
- [ ] Regular security updates
- [ ] SSL/TLS properly configured
- [ ] Backup strategy implemented

### API Security
- [ ] API keys rotated regularly
- [ ] Request logging enabled
- [ ] Error messages don't leak info
- [ ] Rate limiting per user/IP

## Backup & Recovery

### Application Backup
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "/backups/app_backup_$DATE.tar.gz" /path/to/app

# Database backup (if using PostgreSQL)
pg_dump ai_inventory > "/backups/db_backup_$DATE.sql"

# Cleanup old backups (keep 30 days)
find /backups -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery
1. **Automated backups** to S3/Cloud Storage
2. **Infrastructure as Code** (Terraform/CloudFormation)
3. **Database replication** for high availability
4. **Health checks** with automatic failover

## Scaling Considerations

### Horizontal Scaling
- **Load balancers:** Distribute traffic across instances
- **Container orchestration:** Kubernetes/Docker Swarm
- **Database sharding:** Distribute data across servers

### Vertical Scaling
- **Resource monitoring:** CPU, memory, disk usage
- **Auto-scaling:** Based on metrics
- **Performance profiling:** Identify bottlenecks

## Troubleshooting

### Common Issues

**"OpenAI API Error"**
```bash
# Check API key
echo $OPENAI_API_KEY

# Check API quota
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**"Service Unavailable"**
```bash
# Check service status
systemctl status your-service

# Check logs
journalctl -u your-service -f

# Check resources
df -h  # Disk space
free -h  # Memory
top  # CPU usage
```

**"Database Connection Error"**
```bash
# Check database status
systemctl status postgresql

# Test connection
psql -h localhost -U username -d database_name

# Check connections
SELECT * FROM pg_stat_activity;
```

### Performance Issues
```bash
# Profile Node.js app
node --prof server.js
node --prof-process isolate-*.log > processed.txt

# Monitor with New Relic/DataDog
npm install newrelic
```

## Maintenance

### Regular Tasks
- [ ] **Weekly:** Check logs for errors
- [ ] **Monthly:** Update dependencies
- [ ] **Quarterly:** Security audit
- [ ] **As needed:** Scale resources based on usage

### Updates
```bash
# Update dependencies
npm audit
npm update

# Update system packages
sudo apt update && sudo apt upgrade

# Restart services
pm2 restart all
```