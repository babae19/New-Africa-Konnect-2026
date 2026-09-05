# Netlify Deployment Checklist

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] All dependencies in `package.json`
- [ ] `.env.example` updated with all variables
- [ ] `netlify.toml` configured
- [ ] Production build tested locally

## Database Setup

- [ ] Supabase project created
- [ ] Database credentials saved securely
- [ ] Schema deployed (`server/database/schema.sql`)
- [ ] Tables verified (24 tables)

## Backend Deployment (Render)

- [ ] Render account created
- [ ] Web service created
- [ ] Root directory set to `server`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables configured:
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`
  - [ ] `DB_HOST`
  - [ ] `DB_PORT`
  - [ ] `DB_NAME`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `JWT_SECRET` (generated)
  - [ ] `CLIENT_URL`
- [ ] Backend deployed successfully
- [ ] Backend URL copied
- [ ] Health check verified (`/` endpoint)

## Frontend Deployment (Netlify)

- [ ] Netlify account created
- [ ] GitHub repository connected
- [ ] Build settings configured:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`
  - [ ] Base directory: (empty)
- [ ] Environment variables set:
  - [ ] `VITE_API_URL` (backend URL + `/api`)
  - [ ] `VITE_SUPABASE_URL` (optional)
  - [ ] `VITE_SUPABASE_ANON_KEY` (optional)
- [ ] Site deployed successfully
- [ ] Netlify URL copied

## Post-Deployment

- [ ] Update `CLIENT_URL` in Render with Netlify URL
- [ ] Wait for backend redeploy
- [ ] Test frontend loads
- [ ] Test sign up/sign in
- [ ] Test API connectivity
- [ ] Test real-time features (Socket.IO)
- [ ] Check browser console for errors
- [ ] Verify CORS working

## Optional Enhancements

- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] SSL certificate verified (automatic)
- [ ] Netlify Analytics enabled
- [ ] Error tracking added (Sentry)
- [ ] Monitoring set up
- [ ] Staging environment created

## Production Readiness

- [ ] All features tested
- [ ] Error handling verified
- [ ] Performance optimized
- [ ] Security headers confirmed
- [ ] Database backups enabled
- [ ] Documentation updated
- [ ] Team access configured

---

## Quick Commands

```bash
# Test build locally
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint

# Commit and push
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

## Troubleshooting

### Build fails
- Check `package.json` dependencies
- Verify Node version (18+)
- Review build logs in Netlify

### CORS errors
- Verify `CLIENT_URL` matches Netlify URL
- Check backend CORS configuration
- Ensure no trailing slashes

### API not connecting
- Verify `VITE_API_URL` is correct
- Check backend is running
- Test backend health endpoint

---

**Last Updated**: 2026-01-09
