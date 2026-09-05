# Africa Konnect Backend API

Node.js/Express backend API for the Africa Konnect platform with PostgreSQL database and Socket.IO real-time features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
node run-migrations.js

# Start development server
npm run dev

# Start production server
npm start
```

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /logout` - Logout user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### Projects (`/api/projects`)
- `GET /` - List all projects (with filters)
- `POST /` - Create new project
- `GET /:id` - Get project by ID
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project
- `POST /:id/invite` - Invite expert to project
- `PUT /:id/invite` - Respond to project invitation

### Experts (`/api/experts`)
- `GET /` - List all experts (with filters)
- `POST /profile` - Create expert profile
- `GET /profile/:userId` - Get expert profile
- `PUT /profile/:userId` - Update expert profile
- `POST /portfolio` - Add portfolio item
- `DELETE /portfolio/:id` - Remove portfolio item
- `PUT /availability` - Update availability calendar
- `PUT /skills` - Update skills

### Contracts (`/api/contracts`)
- `POST /` - Create contract
- `GET /project/:projectId` - Get project contract
- `GET /user` - Get user's contracts
- `PUT /:id` - Update contract
- `PUT /:id/sign` - Sign contract

### Messages (`/api/messages`)
- `GET /project/:projectId` - Get project messages
- `POST /` - Send message
- `GET /unread` - Get unread messages
- `PUT /:id/read` - Mark message as read
- `PUT /project/:projectId/read` - Mark all project messages as read

### Files (`/api/files`)
- `POST /` - Upload file
- `GET /project/:projectId` - Get project files
- `GET /:id/download` - Download file
- `DELETE /:id` - Delete file
- `POST /:id/versions` - Add file version
- `GET /:id/versions` - Get file versions

### Tasks & Milestones (`/api`)
- `POST /projects/:projectId/tasks` - Create task
- `GET /projects/:projectId/tasks` - Get project tasks
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /projects/:projectId/milestones` - Create milestone
- `GET /projects/:projectId/milestones` - Get project milestones
- `PUT /milestones/:id` - Update milestone

### Payments (`/api`)
- `POST /projects/:projectId/escrow` - Initialize escrow
- `GET /projects/:projectId/escrow` - Get escrow status
- `POST /projects/:projectId/releases` - Request payment release
- `PUT /projects/:projectId/releases/:releaseId/approve` - Approve release

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `DELETE /:id` - Delete notification
- `GET /preferences` - Get notification preferences
- `PUT /preferences` - Update notification preferences

## 🔌 Socket.IO Events

### Client → Server
- `join_project` - Join project room
- `leave_project` - Leave project room
- `join_user` - Join user room
- `send_message` - Send real-time message

### Server → Client
- `new_message` - New message received
- `project_update` - Project status changed
- `task_update` - Task updated
- `milestone_update` - Milestone updated
- `notification` - New notification

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts (clients & experts)
- `expert_profiles` - Expert-specific information
- `projects` - Project details
- `contracts` - Contract agreements
- `messages` - Project messages
- `tasks` - Project tasks
- `milestones` - Project milestones
- `files` - Uploaded files
- `notifications` - User notifications
- `escrow_accounts` - Payment escrow

See `database/schema.sql` for complete schema.

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **JWT Authentication** - Secure token-based auth
- **bcrypt** - Password hashing
- **Input Validation** - Express-validator
- **SQL Injection Protection** - Parameterized queries

## 🛠️ Development Tools

```bash
# Check database tables
node check-tables.js

# Verify schema
node verify-schema.js

# Run migrations
node run-migrations.js

# Clear database (CAUTION!)
node clear-db.js

# Verify real-time flow
node verify-realtime-flow.js
```

## 📊 Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Security
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173
```

## 🚀 Deployment

### Render

1. Create new Web Service
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env.example`

### Railway

1. Create new project from GitHub
2. Set root directory to `server`
3. Add environment variables
4. Deploy automatically on push

### Heroku

```bash
# From project root
heroku create your-app-name
git subtree push --prefix server heroku main
```

See main `DEPLOYMENT.md` for detailed instructions.

## 📝 Logging

The server logs:
- All HTTP requests (method + path)
- Database connection status
- Socket.IO connections
- Error stack traces (development only)

## 🧪 Testing

```bash
# Start server
npm start

# Test health endpoint
curl http://localhost:5000/

# Test API endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/projects
```

## 🔧 Troubleshooting

### Database Connection Issues
- Verify `DB_*` environment variables
- Check database is running and accessible
- Ensure firewall allows connection
- Test connection with `psql` command

### Socket.IO Not Working
- Check CORS configuration
- Verify `CLIENT_URL` matches frontend
- Ensure WebSocket support on hosting platform

### JWT Errors
- Verify `JWT_SECRET` is set
- Check token expiration time
- Ensure consistent secret across restarts

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Backend API for Africa Konnect Platform**
