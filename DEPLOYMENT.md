# Deployment Guide - Teacher Frontend

This guide covers deploying the Teacher Frontend application to various hosting platforms.

## Build Process

### 1. Environment Configuration

Create production environment file:
```bash
# .env.production
REACT_APP_API_URL=https://your-api-domain.com/api/v1
```

### 2. Build Application

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Deployment Options

### Option 1: Static File Hosting (Netlify, Vercel, GitHub Pages)

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in site settings:
   - `REACT_APP_API_URL`: Your API URL

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to deploy
4. Set environment variables in dashboard

#### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/teacher-frontend",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Run: `npm run deploy`

### Option 2: Web Server (Apache, Nginx)

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name teacher.yourschool.com;
    root /path/to/build;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### Apache Configuration (.htaccess)
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### Option 3: Docker Deployment

#### Dockerfile
```dockerfile
# Build stage
FROM node:16-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf for Docker
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### Docker Commands
```bash
# Build image
docker build -t teacher-frontend .

# Run container
docker run -d -p 3001:80 --name teacher-app teacher-frontend

# With environment variables
docker run -d -p 3001:80 \
  -e REACT_APP_API_URL=https://api.yourschool.com/api/v1 \
  --name teacher-app teacher-frontend
```

### Option 4: Docker Compose with Backend

#### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=http://backend:3000/api/v1
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build: 
      context: ./
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/attendance
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=attendance
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

## Production Checklist

### Security
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured (no sensitive data in code)
- [ ] API URLs use HTTPS in production
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] CORS properly configured on backend

### Performance
- [ ] Gzip/Brotli compression enabled
- [ ] Static asset caching configured
- [ ] CDN setup for global distribution
- [ ] Bundle size analyzed and optimized
- [ ] Images optimized and properly sized

### Monitoring
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Analytics (Google Analytics, Mixpanel)
- [ ] Performance monitoring (Web Vitals)
- [ ] Uptime monitoring
- [ ] Log aggregation setup

### Testing
- [ ] Production build tested locally
- [ ] All API endpoints accessible
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested
- [ ] QR code functionality tested on mobile devices

## Environment Variables

### Required
- `REACT_APP_API_URL`: Backend API base URL

### Optional
- `REACT_APP_ENVIRONMENT`: Environment name (production, staging)
- `REACT_APP_SENTRY_DSN`: Error tracking DSN
- `REACT_APP_GA_ID`: Google Analytics ID

## Troubleshooting

### Common Issues

**White Screen (Blank Page)**
- Check browser console for JavaScript errors
- Verify API URL is correct and accessible
- Ensure build process completed successfully

**API Connection Errors**
- Verify CORS configuration on backend
- Check network connectivity to API
- Confirm API is running and healthy

**Routing Issues (404 on Refresh)**
- Ensure server is configured for SPA routing
- Check `.htaccess` or Nginx configuration
- Verify `try_files` directive is correct

**Build Failures**
- Clear node_modules and package-lock.json
- Run `npm install` fresh
- Check for conflicting dependencies

### Performance Issues

**Slow Loading**
- Enable gzip compression on server
- Optimize images and reduce bundle size
- Implement code splitting for large components
- Use CDN for static assets

**Memory Issues**
- Check for memory leaks in components
- Ensure proper cleanup of event listeners
- Optimize re-renders with React.memo

## SSL Certificate Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d teacher.yourschool.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare (Free Tier)
1. Add domain to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Set SSL/TLS mode to "Full (strict)"

## Backup Strategy

### Code Backup
- Git repository with proper branching
- Regular commits and tags for releases
- Mirror repository for redundancy

### Build Artifacts
- Store built assets in artifact repository
- Version builds with semantic versioning
- Maintain rollback capability

### Configuration Backup
- Document environment variables
- Backup server configurations
- Maintain infrastructure as code

## Scaling Considerations

### CDN Integration
- Use CloudFront, Cloudflare, or similar
- Configure proper cache headers
- Implement cache invalidation strategy

### Multiple Environments
- Staging environment for testing
- Development environment for features
- Production environment for live traffic

### Load Balancing
- Multiple server instances
- Health check endpoints
- Graceful degradation strategies

---

For additional support, refer to the main README.md or contact the development team.