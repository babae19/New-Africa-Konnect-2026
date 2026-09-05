# Africa Konnect

A comprehensive platform connecting African businesses with vetted experts for project collaboration, featuring real-time communication, contract management, and secure escrow payments.

## 🌍 Overview

Africa Konnect bridges the gap between businesses across Africa and skilled professionals, providing a trusted platform for project collaboration. The platform includes expert vetting, project management, real-time collaboration tools, and secure payment processing.

## ✨ Features

- **Expert Vetting System**: Multi-stage verification process for expert profiles
- **Project Hub**: Complete project lifecycle management from creation to completion
- **Real-time Collaboration**: Socket.IO-powered messaging and live updates
- **Contract Management**: Digital contract creation, signing, and tracking
- **Escrow Payments**: Secure milestone-based payment system
- **Expert Directory**: Searchable database of verified professionals
- **Role-based Access**: Separate dashboards for clients and experts
- **File Management**: Upload, version control, and sharing of project files
- **Notifications**: Real-time alerts for project updates and messages

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database (via Supabase)
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - API protection

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (Supabase recommended)
- **Git** for version control

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/africa-konnect.git
cd africa-konnect
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

#### Frontend (.env)

Create a `.env` file in the root directory:

```bash
VITE_API_URL=/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Backend (server/.env)

Create a `server/.env` file:

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

# JWT
JWT_SECRET=your-jwt-secret-key

# CORS
CLIENT_URL=http://localhost:5173
```

### 4. Set Up Database

Run the database schema:

```bash
# Using psql
psql -h your-db-host -U your-db-user -d your-db-name -f server/database/schema.sql

# Or use Supabase SQL Editor to run server/database/schema.sql
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
africa-konnect/
├── public/               # Static assets
│   ├── _redirects       # Cloudflare Pages SPA routing
│   └── _headers         # Security headers
├── src/                 # Frontend source
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature-specific components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and API client
│   └── App.jsx         # Main app component
├── server/             # Backend source
│   ├── controllers/    # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── database/       # Database schema and migrations
│   ├── services/       # Business logic
│   └── socket/         # Socket.IO configuration
├── .env.example        # Frontend environment template
├── server/.env.example # Backend environment template
└── DEPLOYMENT.md       # Deployment guide
```

## 🌐 Deployment

### Netlify (Recommended)

See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete Netlify deployment guide.

**Quick Start**:
1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables
4. Deploy!

**Checklist**: See [NETLIFY_CHECKLIST.md](./NETLIFY_CHECKLIST.md)

### Alternative: Cloudflare Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare Pages deployment:
- **Frontend**: Cloudflare Pages
- **Backend**: Render
- **Database**: Supabase PostgreSQL

## 🔑 Environment Variables

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` (dev) or `https://api.example.com/api` (prod) |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |

See `server/.env.example` for complete list with optional variables.

## 🧪 Testing

```bash
# Run frontend build test
npm run build
npm run preview

# Test backend
cd server
npm start
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### Experts
- `GET /api/experts` - List verified experts
- `POST /api/experts/profile` - Create expert profile
- `GET /api/experts/profile/:userId` - Get expert profile

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts/project/:projectId` - Get project contract
- `PUT /api/contracts/:id/sign` - Sign contract

See backend code for complete API reference.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review server logs for backend issues

## 🎯 Roadmap

- [ ] Payment gateway integration (Stripe/Paystack)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Video conferencing integration

---

**Built with ❤️ for connecting African talent with opportunities**
