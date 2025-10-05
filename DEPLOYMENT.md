# SafetySnap Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended)
Railway provides excellent Node.js support with persistent storage.

1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Deploy backend and frontend as separate services
4. Configure environment variables

**Backend Railway Setup:**
- Service: Node.js
- Start Command: `npm start`
- Environment Variables:
  ```
  NODE_ENV=production
  PORT=3001
  DATABASE_PATH=/app/data/database.sqlite
  UPLOAD_DIR=/app/uploads
  ```

**Frontend Railway Setup:**
- Service: Static Site
- Build Command: `npm run build`
- Start Command: `npx serve -s dist`

### 2. Render
Free tier with excellent support for full-stack apps.

1. Create account at render.com
2. Connect GitHub repository
3. Create Web Service for backend
4. Create Static Site for frontend

**Backend Render Setup:**
- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables

**Frontend Render Setup:**
- Environment: Static Site
- Build Command: `npm run build`
- Publish Directory: `dist`

### 3. Vercel + PlanetScale/Railway (Hybrid)
Deploy frontend on Vercel, backend on Railway/Render.

1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render
3. Update VITE_API_URL in frontend environment

### 4. Docker Deployment
For VPS or cloud deployment:

```bash
# Clone repository
git clone <your-repo-url>
cd SafetySnap

# Run with Docker Compose
docker-compose up -d
```

### 5. Manual VPS Deployment

```bash
# Backend setup
cd backend
npm install --production
npm start

# Frontend setup (separate server or nginx)
cd frontend
npm install
npm run build
# Serve dist/ folder with nginx or serve
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Database Considerations

- SQLite works well for demos and small scale
- For production, consider PostgreSQL on Railway/Render
- Database migrations handled automatically on startup

## File Storage

- Local file storage works for demos
- For production, consider:
  - Railway persistent volumes
  - AWS S3 + CloudFront
  - Cloudinary for image optimization

## Performance Tips

1. **Frontend Optimization:**
   - Images optimized and compressed
   - Code splitting enabled
   - Static assets cached

2. **Backend Optimization:**
   - Rate limiting configured
   - File upload size limits
   - Database connection pooling

3. **CDN Setup:**
   - Use Cloudflare for caching
   - Optimize image delivery

## Monitoring & Maintenance

- Use platform-specific monitoring
- Set up error tracking (Sentry)
- Monitor API performance
- Regular database backups

## Troubleshooting

**Common Issues:**
1. CORS errors - Check CORS_ORIGIN setting
2. File upload fails - Check MAX_FILE_SIZE
3. Database locked - Restart service
4. Rate limiting - Check client requests

**Logs:**
- Railway: Check service logs
- Render: View build and runtime logs
- Vercel: Check function logs