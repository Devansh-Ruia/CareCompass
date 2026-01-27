# MedFin Deployment Guide

## Overview
This guide covers the production deployment of the MedFin Healthcare Financial Navigator using:
- **Frontend**: Next.js 14 on Vercel
- **Backend**: FastAPI on Render

## Backend Deployment (Render)

### Prerequisites
- Render account
- Git repository access

### Configuration

#### 1. Service Settings
- **Service Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `bash start.sh`

#### 2. Environment Variables
```
ENV=production
PORT=8000
```

#### 3. Deployed Files
- `backend/requirements.txt` - Production dependencies
- `backend/start.sh` - Startup script for Render
- `backend/app/main.py` - FastAPI application
- `backend/app/core/config.py` - Production configuration

### Key Features
- CORS configured for `https://medfin.vercel.app`
- Health check endpoint at `/health`
- API documentation at `/docs`
- Stateless design (no database)

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Git repository access

### Configuration

#### 1. Project Settings
- **Framework**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### 2. Environment Variables
```
NEXT_PUBLIC_API_URL=https://medfin-api.onrender.com
```

#### 3. Deployed Files
- `frontend/.env.production` - Production environment
- `frontend/package.json` - Dependencies and scripts
- `frontend/app/` - Next.js application

### Key Features
- API calls use environment variables
- Production-ready build
- Security disclaimer in footer
- Responsive design with Tailwind CSS

## Post-Deployment Verification

### Backend Checks
1. **Health Endpoint**: `https://medfin-api.onrender.com/health`
   - Expected: `{"status": "healthy"}`

2. **API Documentation**: `https://medfin-api.onrender.com/docs`
   - Verify all endpoints are accessible

3. **CORS Configuration**: Test from browser console
   - Ensure requests from Vercel domain are accepted

### Frontend Checks
1. **Main Application**: `https://medfin.vercel.app`
   - Verify page loads correctly
   - Check all tabs and components

2. **API Integration**: Test each feature
   - Cost estimation
   - Bill analysis
   - Insurance analysis
   - Assistance programs
   - Payment plans

3. **Security**: Verify footer disclaimer
   - Text: "MedFin provides informational assistance only and is not medical or financial advice."

## Security Considerations

### Implemented
- CORS restricted to Vercel domain
- No PHI storage
- No authentication required
- Input validation in FastAPI
- HTTPS enforced by both platforms

### Recommendations
- Rate limiting (Render add-on)
- Error logging (Render add-on)
- Custom domain setup
- CI/CD pipeline

## Troubleshooting

### Common Issues
1. **CORS Errors**: Verify backend `cors_origins` setting
2. **Build Failures**: Check dependency versions
3. **API Timeouts**: Verify Render service is running
4. **Environment Variables**: Ensure correct naming and values

### Monitoring
- Render: Service logs and metrics
- Vercel: Build logs and analytics
- Both platforms provide uptime monitoring

## Deployment Commands

### Backend (Render)
```bash
# Push to trigger deployment
git push origin main
```

### Frontend (Vercel)
```bash
# Push to trigger deployment
git push origin main
# Or deploy via Vercel CLI
vercel --prod
```

## Next Steps

1. Deploy backend to Render first
2. Note the deployed URL
3. Update frontend environment variable if needed
4. Deploy frontend to Vercel
5. Run verification tests
6. Set up monitoring and alerts

#Testing Commit