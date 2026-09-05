# 🚀 Quick Setup Guide

## Prerequisites

You need two pieces of information:

1. **Supabase Database Password** - The password for your PostgreSQL database
2. **Supabase Anon Key** - Get from https://app.supabase.com/project/kifppregsosrjyewoyis/settings/api

## Setup Steps

### 1. Configure Backend Environment

Edit `server/.env` and replace `[YOUR-PASSWORD]`:

```env
DB_PASSWORD=your-actual-password-here
```

### 2. Configure Frontend Environment

Edit `.env` and add your Supabase Anon Key:

```env
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 3. Initialize Database

```bash
cd server
node database/init.js
```

Expected output:
```
🔄 Initializing database...
📝 Creating tables and indexes...
✅ Database schema created successfully!
📊 Created tables:
   - users
   - expert_profiles
   - projects
   - contracts
   - messages
✨ Database initialization complete!
```

### 4. Start Backend Server

```bash
npm run dev
```

Expected output:
```
🚀 Server running on port 5000
📊 Database: PostgreSQL (Supabase)
🌍 Environment: development
```

### 5. Start Frontend

In a new terminal:

```bash
cd ..
npm run dev
```

## Testing

### Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### "Failed to connect to database"
- Check your password in `server/.env`
- Verify your IP is whitelisted in Supabase

### "Port 5000 already in use"
- Change PORT in `server/.env` to another port (e.g., 5001)

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `.env`

## Next Steps

Once everything is running:

1. ✅ Register as a client
2. ✅ Register as an expert
3. ✅ Create an expert profile
4. ✅ Create a project
5. ✅ Browse experts
6. ✅ Create a contract
7. ✅ Test messaging

For detailed API documentation, see `server/README.md`
