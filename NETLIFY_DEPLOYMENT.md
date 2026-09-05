# Africa Konnect - Netlify Deployment Guide

Complete guide for deploying the Africa Konnect application to Netlify (frontend) and Render (backend).

## Prerequisites

- GitHub account with your code pushed
- Netlify account (free tier available)
- Render account for backend (free tier available)
- PostgreSQL database (Supabase recommended)

---

## Part 1: Backend Deployment (Render)

### Step 1: Set Up Database (Supabase)

1. Go to [Supabase](https://supabase.com) and create account
2. Create new project:
   - **Name**: `africa-konnect`
   - **Database Password**: Create strong password (save it!)
   - **Region**: Choose closest to your users
3. Wait for project creation (~2 minutes)
4. Go to **Settings** → **Database** and copy:
   - Host
   - Database name
   - Port
   - User
   - Password
5. Go to **SQL Editor** and run `server/database/schema.sql`
6. Verify tables are created

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure service:

   **Basic Settings:**
   - **Name**: `africa-konnect-api`
   - **Region**: Choose closest to users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid)

5. **Environment Variables** - Add these:

```bash
# Server
PORT=5000
NODE_ENV=production

# Database (from Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password

# JWT Secret (generate new one!)
JWT_SECRET=your-production-jwt-secret

# CORS (will update after Netlify deployment)
CLIENT_URL=http://localhost:5173
```

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. Click **Create Web Service**
7. Wait for deployment (~3-5 minutes)
8. **Copy your Render URL**: `https://africa-konnect-api.onrender.com`

### Step 3: Verify Backend

Visit: `https://your-app.onrender.com/`

Expected response:
```json
{
  "message": "Africa Konnect API Running",
  "version": "2.0.0",
  "database": "PostgreSQL",
  "realtime": "Enabled"
}
```

---

## Part 2: Frontend Deployment (Netlify)

### Step 1: Prepare Repository

Ensure all changes are committed:
```bash
git add .
git commit -m "Configure for Netlify deployment"
git push origin main
```

### Step 2: Create Netlify Site

1. Go to [Netlify](https://app.netlify.com/)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify
4. Select your `africa-konnect` repository

### Step 3: Configure Build Settings

**Site settings:**
- **Site name**: `africa-konnect` (or your preferred subdomain)
- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: (leave empty)

### Step 4: Environment Variables

Click **Site settings** → **Environment variables** → **Add a variable**

Add these variables:

```bash
# Required - Backend API URL (use your Render URL)
VITE_API_URL=https://africa-konnect-api.onrender.com/api

# Optional - Supabase (if using)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Important**: Replace `africa-konnect-api.onrender.com` with your actual Render URL from Part 1, Step 2.

### Step 5: Deploy

1. Click **Deploy site**
2. Netlify will build and deploy (~2-3 minutes)
3. You'll get a URL like: `https://africa-konnect.netlify.app`

### Step 6: Update Backend CORS

Now update your Render backend to allow the Netlify URL:

1. Go to Render dashboard → Your web service
2. Go to **Environment** tab
3. Update `CLIENT_URL`:
   ```bash
   CLIENT_URL=https://africa-konnect.netlify.app
   ```
4. Save (service will redeploy automatically)

### Step 7: Custom Domain (Optional)

1. In Netlify, go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration instructions
4. Netlify provides free SSL automatically

If using custom domain, update `CLIENT_URL` in Render again.

---

## Part 3: Verification

### Test Backend

```bash
curl https://your-backend.onrender.com/
```

Should return API info JSON.

### Test Frontend

1. Visit: `https://africa-konnect.netlify.app`
2. Application should load
3. Try sign up/sign in
4. Check browser console for errors
5. Verify API calls reach backend

### Test Real-time Features

1. Open two browser windows
2. Sign in as different users
3. Test messaging/collaboration
4. Verify Socket.IO connections work

---

## Netlify-Specific Features

### Automatic Deployments

- **Every push to `main`** triggers automatic deployment
- **Pull requests** get preview deployments
- **Branch deploys** for testing

### Deploy Previews

Each PR gets a unique URL:
- `https://deploy-preview-123--africa-konnect.netlify.app`
- Perfect for testing before merging

### Rollbacks

Easy rollback to previous deployments:
1. Go to **Deploys** tab
2. Find previous successful deploy
3. Click **Publish deploy**

### Build Hooks

Create webhook URLs for triggering builds:
1. **Site settings** → **Build & deploy** → **Build hooks**
2. Create hook (e.g., "Rebuild on content change")
3. Use webhook URL to trigger builds

---

## Configuration Files

### netlify.toml

Located at project root. Contains:
- Build settings
- Redirect rules (SPA routing)
- Security headers
- Cache control
- Environment-specific configs

### public/_redirects

Backup SPA routing (netlify.toml takes precedence):
```
/*  /index.html  200
```

### public/_headers

Additional security headers (netlify.toml takes precedence).

---

## Environment Variables Reference

### Frontend (Netlify)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | Yes |
| `VITE_SUPABASE_URL` | Your Supabase URL | Optional |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Optional |

### Backend (Render)

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `5000` | Yes |
| `NODE_ENV` | `production` | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | `5432` | Yes |
| `DB_NAME` | `postgres` | Yes |
| `DB_USER` | `postgres` | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | Generated secret | Yes |
| `CLIENT_URL` | `https://africa-konnect.netlify.app` | Yes |

---

## Troubleshooting

### Build Fails on Netlify

**Check build logs**:
1. Go to **Deploys** tab
2. Click failed deploy
3. View build log

**Common issues**:
- Missing dependencies in `package.json`
- Node version mismatch
- Environment variables not set
- Build command incorrect

**Solutions**:
- Verify `package.json` has all dependencies
- Set `NODE_VERSION=18` in netlify.toml
- Check environment variables are set
- Ensure build command is `npm run build`

### CORS Errors

**Problem**: API calls blocked by CORS

**Solution**:
1. Verify `CLIENT_URL` in Render matches Netlify URL exactly
2. No trailing slashes
3. Check Render logs for CORS messages
4. Ensure backend CORS config includes Netlify URL

### API Calls Failing

**Problem**: Frontend can't reach backend

**Solution**:
1. Check `VITE_API_URL` is set correctly in Netlify
2. Must include `/api` at the end
3. Verify backend is running (visit backend URL)
4. Check browser console for errors

### Socket.IO Not Connecting

**Problem**: Real-time features don't work

**Solution**:
1. Verify `VITE_API_URL` is set in Netlify
2. Check backend allows WebSocket connections
3. Ensure Render allows WebSocket (it does by default)
4. Check browser console for WebSocket errors

### Render Free Tier Issues

**Limitations**:
- Services sleep after 15 minutes inactivity
- First request takes 30-60 seconds to wake
- 750 hours/month free

**Solutions**:
- Upgrade to paid plan for production
- Use external monitoring to keep service awake
- Warn users about initial load time

---

## Performance Optimization

### Netlify CDN

- Automatic global CDN
- No configuration needed
- Assets cached at edge locations

### Asset Optimization

Already configured in `vite.config.js`:
- Code splitting
- Vendor chunk separation
- Tree shaking
- Minification

### Caching Strategy

Configured in `netlify.toml`:
- Static assets: 1 year cache
- HTML: No cache (always fresh)
- API calls: No cache

---

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets (64+ characters)
- ✅ Rotate secrets periodically
- ✅ Different secrets for dev/prod

### HTTPS

- ✅ Netlify provides free SSL
- ✅ Render provides free SSL
- ✅ Force HTTPS (automatic)

### Headers

Security headers configured:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Database

- ✅ Use connection pooling (Supabase default)
- ✅ Enable SSL connections
- ✅ Regular backups (Supabase automatic)
- ✅ Restrict database access by IP (optional)

---

## Monitoring & Analytics

### Netlify Analytics

Enable in **Site settings** → **Analytics**:
- Page views
- Unique visitors
- Top pages
- Bandwidth usage

### Render Metrics

View in Render dashboard:
- CPU usage
- Memory usage
- Request count
- Response times

### Error Tracking

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for full monitoring

---

## Continuous Deployment Workflow

### Development Flow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and test locally**

3. **Push to GitHub**:
   ```bash
   git push origin feature/new-feature
   ```

4. **Create Pull Request**:
   - Netlify creates deploy preview
   - Test on preview URL
   - Review and merge

5. **Merge to main**:
   - Automatic production deployment
   - Live in ~2 minutes

### Hotfix Flow

1. **Create hotfix branch from main**
2. **Fix issue**
3. **Push and create PR**
4. **Test on deploy preview**
5. **Merge immediately**
6. **Production deploys automatically**

---

## Cost Breakdown

### Free Tier Limits

**Netlify Free**:
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Deploy previews
- Free SSL

**Render Free**:
- 750 hours/month
- 512 MB RAM
- Shared CPU
- Services sleep after 15 min

**Supabase Free**:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users

### When to Upgrade

**Netlify Pro** ($19/mo):
- More bandwidth
- More build minutes
- Analytics
- Password protection

**Render Starter** ($7/mo):
- No sleeping
- More resources
- Better performance

**Supabase Pro** ($25/mo):
- 8 GB database
- 100 GB bandwidth
- Daily backups

---

## Next Steps After Deployment

1. **Set up monitoring**:
   - Enable Netlify Analytics
   - Add error tracking (Sentry)
   - Set up uptime monitoring

2. **Configure custom domain**:
   - Purchase domain
   - Configure DNS
   - Update environment variables

3. **Add CI/CD enhancements**:
   - Automated tests
   - Linting checks
   - Security scanning

4. **Optimize performance**:
   - Enable Netlify image optimization
   - Add service worker for PWA
   - Implement lazy loading

5. **Set up staging environment**:
   - Create staging branch
   - Deploy to separate Netlify site
   - Use separate database

---

## Support Resources

- **Netlify**: [Documentation](https://docs.netlify.com/)
- **Render**: [Documentation](https://render.com/docs)
- **Supabase**: [Documentation](https://supabase.com/docs)
- **Vite**: [Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Netlify (if using CLI)
netlify deploy --prod

# Check build locally
npm run build && npm run preview
```

---

**Your application is ready for Netlify deployment! 🚀**

**URLs after deployment**:
- Frontend: `https://africa-konnect.netlify.app`
- Backend: `https://africa-konnect-api.onrender.com`
- Database: Supabase dashboard
