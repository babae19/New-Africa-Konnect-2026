# Netlify Deployment Guide

## Prerequisites
- **GitHub Account**: Your project should be pushed to a GitHub repository.
- **Netlify Account**: Sign up at [netlify.com](https://netlify.com).
- **Backend Hosting**: Since Netlify primarily hosts the frontend (and Serverless Functions), your Express backend (`server/`) must be deployed to a Node.js hosting provider. **Render** is recommended for compatibility.

## Part 1: Deploying Backend (Target: Render)
1.  Push your code to GitHub.
2.  Create a new **Web Service** on [Render.com](https://render.com).
3.  Connect your repo.
4.  **Root Directory**: `server`
5.  **Build Command**: `npm install`
6.  **Start Command**: `npm start`
7.  **Environment Variables** (Add these in Render Dashboard):
    - `NODE_ENV`: `production`
    - `DB_USER`: (Your Supabase DB User)
    - `DB_HOST`: (Your Supabase DB Host)
    - `DB_NAME`: `postgres`
    - `DB_PASSWORD`: (Your Supabase DB Password)
    - `DB_PORT`: `5432`
    - `JWT_SECRET`: (Generate a secure random string)
    - `AI_API_KEY`: (Your DeepSeek/OpenAI Key)
    - `CLIENT_URL`: `https://your-site-name.netlify.app` (You will set this AFTER Part 2)

## Part 2: Deploying Frontend (Target: Netlify)
1.  Log in to [Netlify](https://netlify.com) and click **"Add new site"** > **"Import from an existing project"**.
2.  Connect to GitHub and select your repository.
3.  **Build Settings**:
    - **Base directory**: (Leave empty)
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
4.  **Environment Variables**:
    - Click on **"Show advanced"** or go to **Site Settings > Environment variables** after creation.
    - Add `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-service.onrender.com/api`).
    - **Important**: Do not add a trailing slash to the API URL if your code appends one, but usually `/api` is safe. Note that your frontend code defaults to `/api` if this is not set, which will fail on Netlify unless you configure a proxy. Setting `VITE_API_URL` is the best practice.

## Part 3: Final Configuration
1.  Once Netlify deploys, copy the **Netlify Site URL** (e.g., `https://africa-konnect.netlify.app`).
2.  Go back to your Backend (Render) dashboard.
3.  Update (or add) the `CLIENT_URL` variable with this Netlify URL to allow CORS requests.
4.  Redeploy the backend manually if needed to apply the change.

## Troubleshooting
- **Lint Errors Blocking Build**: If Netlify build fails due to lint warnings (treated as errors by default in CI), verify that your `eslint.config.js` sets rules to `warn` or add the environment variable `CI=false` in Netlify to bypass linting checks.
- **Microservices**: If you wish to use Netlify Functions instead of Render, a significant refactor of `server/` into serverless handlers would be required. The method above (Frontend on Netlify, Backend on Render) satisfies the "Production Ready" requirement for your current architecture.
