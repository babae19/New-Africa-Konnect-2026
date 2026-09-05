# Africa Konnect Deployment Guide

This guide covers deploying the Africa Konnect application to production. The frontend will be deployed to **Cloudflare Pages** and the backend to **Render** (or your preferred Node.js hosting platform).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment (Cloudflare Pages)](#frontend-deployment-cloudflare-pages)
- [Backend Deployment (Render)](#backend-deployment-render)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Your code should be pushed to a GitHub repository
2. **Cloudflare Account** - For frontend hosting (free tier available)
3. **Render Account** - For backend hosting (free tier available)
4. **PostgreSQL Database** - Supabase (recommended) or another PostgreSQL provider
5. **Domain Name** (Optional) - For custom domain setup

---

## Frontend Deployment (Cloudflare Pages)

### Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. Verify `.env` is in `.gitignore` (it should be - never commit secrets!)

### Step 2: Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub account and select your repository
4. Configure build settings:
   - **Project name**: `africa-konnect` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if project is at root)

### Step 3: Configure Environment Variables

In Cloudflare Pages project settings, add these environment variables:

```bash
# Required
VITE_API_URL=https://your-backend-url.onrender.com/api

# Optional (if using Supabase)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Important**: Replace `your-backend-url.onrender.com` with your actual backend URL (you'll get this after deploying the backend)

### Step 4: Deploy

1. Click **Save and Deploy**
2. Cloudflare will build and deploy your application
3. You'll receive a URL like: `https://africa-konnect.pages.dev`

### Step 5: Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Add your domain and follow DNS configuration instructions
3. Cloudflare provides free SSL certificates automatically

---

## Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. Ensure `server/package.json` has a start script:
   ```json
   "scripts": {
     "start": "node index.js",
     "dev": "nodemon index.js"
   }
   ```

2. Verify your backend listens on `0.0.0.0` (already configured in `server/index.js`)

### Step 2: Create Render Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `africa-konnect-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

### Step 3: Configure Environment Variables

Add these environment variables in Render:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (from Supabase)
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-db-password

# JWT Secret (generate a strong random string)
JWT_SECRET=your-production-jwt-secret-here

# CORS - Your Cloudflare Pages URL
CLIENT_URL=https://africa-konnect.pages.dev

# Optional: Multiple origins (comma-separated)
# ALLOWED_ORIGINS=https://africa-konnect.pages.dev,https://yourdomain.com
```

> **Generate JWT Secret**: Run this command locally:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will build and deploy your backend
3. You'll receive a URL like: `https://africa-konnect-api.onrender.com`

### Step 5: Update Frontend Environment Variables

1. Go back to Cloudflare Pages
2. Update `VITE_API_URL` with your Render backend URL:
   ```bash
   VITE_API_URL=https://africa-konnect-api.onrender.com/api
   ```
3. Trigger a redeploy in Cloudflare Pages

---

## Database Setup

### Using Supabase (Recommended)

1. Create a [Supabase](https://supabase.com/) account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy connection details:
   - Host
   - Database name
   - Port
   - User
   - Password

5. Run database migrations:
   ```bash
   # Connect to your database and run schema
   psql -h db.xxxxx.supabase.co -U postgres -d postgres -f server/database/schema.sql
   ```

   Or use Supabase SQL Editor to run `server/database/schema.sql`

### Alternative: Render PostgreSQL

1. In Render, create a **New PostgreSQL** database
2. Copy connection details to your backend environment variables

---

## Environment Variables

### Frontend (.env)

```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (server/.env)

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password

# Security
JWT_SECRET=your-production-jwt-secret

# CORS
CLIENT_URL=https://africa-konnect.pages.dev
```

---

## Post-Deployment Verification

### 1. Test Backend Health

Visit your backend URL:
```
https://your-backend-url.onrender.com/
```

You should see:
```json
{
  "message": "Africa Konnect API Running",
  "version": "2.0.0",
  "database": "PostgreSQL",
  "realtime": "Enabled"
}
```

### 2. Test Frontend

1. Visit your Cloudflare Pages URL
2. Try to sign up/sign in
3. Check browser console for errors
4. Verify API calls are reaching the backend

### 3. Test Real-time Features

1. Open two browser windows
2. Log in as different users
3. Test messaging/collaboration features
4. Verify Socket.IO connections work

---

## Troubleshooting

### CORS Errors

**Problem**: Browser shows CORS errors

**Solution**:
1. Verify `CLIENT_URL` in backend matches your frontend URL exactly
2. Ensure no trailing slashes in URLs
3. Check Render logs for CORS configuration

### Database Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
1. Verify all `DB_*` environment variables are correct
2. Check database is accessible from Render's IP range
3. Ensure database password doesn't contain special characters that need escaping

### Socket.IO Not Connecting

**Problem**: Real-time features don't work

**Solution**:
1. Check `VITE_API_URL` is set correctly in frontend
2. Verify backend is running and accessible
3. Check browser console for WebSocket connection errors
4. Ensure Render allows WebSocket connections (it does by default)

### Build Failures

**Frontend Build Fails**:
- Check Node version compatibility
- Verify all dependencies are in `package.json`
- Review build logs in Cloudflare Pages

**Backend Build Fails**:
- Ensure `server/package.json` exists
- Verify Node version in Render settings
- Check build logs for missing dependencies

### Free Tier Limitations

**Render Free Tier**:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading for production use

**Cloudflare Pages**:
- 500 builds per month (free tier)
- Unlimited bandwidth and requests

---

## Production Best Practices

1. **Use Strong Secrets**: Generate cryptographically secure JWT secrets
2. **Enable HTTPS**: Both Cloudflare and Render provide free SSL
3. **Monitor Logs**: Check Render logs regularly for errors
4. **Database Backups**: Enable automatic backups in Supabase
5. **Rate Limiting**: Already configured in the backend
6. **Environment Separation**: Use different databases for staging/production
7. **Custom Domain**: Use a custom domain for professional appearance

---

## Continuous Deployment

Both Cloudflare Pages and Render support automatic deployments:

1. **Push to GitHub**: Any push to `main` branch triggers deployment
2. **Preview Deployments**: Cloudflare creates preview URLs for pull requests
3. **Rollback**: Both platforms allow easy rollback to previous deployments

---

## Support

For deployment issues:
- **Cloudflare Pages**: [Documentation](https://developers.cloudflare.com/pages/)
- **Render**: [Documentation](https://render.com/docs)
- **Supabase**: [Documentation](https://supabase.com/docs)

---

## Next Steps

After successful deployment:

1. Set up monitoring and error tracking
2. Configure custom domain
3. Set up email service for notifications
4. Implement analytics
5. Create staging environment for testing

---

**Congratulations! Your Africa Konnect application is now live! 🎉**
