# ServiceHub - Service Marketplace Platform

A full-stack service marketplace application (like TaskRabbit/Sulekha) built with React, Node.js, and PostgreSQL.

## Features

### Phase 1: Authentication & Core Setup (Current) ✓
- User registration and login
- JWT-based authentication
- User profiles
- Role-based access (customer, provider, admin)

### Phase 2: Service Discovery (In Progress)
- Service listing with filters
- Quality/rating filters
- Price range filters
- Location-based search (nearest services)
- Provider profiles and reviews
- Map integration

### Phase 3: Booking System
- Create service booking requests
- Provider acceptance/rejection
- Booking timeline and status tracking
- Cancellation handling

### Phase 4: Reviews & Ratings
- Submit ratings and reviews
- Display provider ratings
- Review filtering and sorting

### Phase 5: Messaging
- Real-time in-app messaging
- Chat history
- Conversation management

### Phase 6: Payment Processing
- Stripe integration
- Payment intent creation
- Refund handling
- Commission tracking

### Phase 7: Provider Features
- Provider dashboard
- Earnings and payout tracking
- Service management
- Availability scheduling

### Phase 8: Admin Dashboard
- User management
- Provider verification
- Dispute resolution
- Analytics and reporting

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **Authentication**: JWT
- **Payments**: Stripe
- **Real-time**: Socket.io
- **Job Queue**: pg-boss

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Maps**: Google Maps API
- **Real-time**: Socket.io Client
- **Animations**: Framer Motion

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16 + PostGIS
- **Cache**: Redis 7

## Project Structure

```
ServiceHub/
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   └── package.json
│
├── frontend/              # React web app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   ├── store/        # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   └── package.json
│
├── database/              # Database schema and migrations
│   ├── schema/           # SQL schema files
│   ├── migrations/       # Database migrations
│   └── seeds/            # Seed data
│
├── docker-compose.yml    # Local development setup
├── README.md
└── docs/                 # Documentation
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ with PostGIS
- Redis 7+

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to project
cd /Users/vinoth-2442/Personal/ServiceHub

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432
- Redis: localhost:6379

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Database Setup:**
```bash
# Create database and user
createdb -U postgres servicehub

# Initialize schema
psql -U servicehub -d servicehub -f database/schema/tables.sql
```

## API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register        - Register new user
POST   /api/v1/auth/login           - Login user
POST   /api/v1/auth/logout          - Logout user
POST   /api/v1/auth/refresh-token   - Refresh access token
GET    /api/v1/auth/me              - Get current user
```

### Service Endpoints (Phase 2)

```
GET    /api/v1/services             - List services with filters
GET    /api/v1/services/:id         - Get service details
POST   /api/v1/services             - Create service (provider only)
```

(More endpoints documented in `docs/API.md`)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://servicehub:servicehub_pass@localhost:5432/servicehub
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_xxx
GOOGLE_MAPS_API_KEY=xxx
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_GOOGLE_MAPS_API_KEY=xxx
```

## Development Workflow

### Creating a New Feature

1. Create a new branch: `git checkout -b feature/feature-name`
2. Follow the feature phase in the roadmap
3. Implement backend endpoints first, then frontend
4. Test with Postman/curl before UI implementation
5. Create PR with detailed description

### Database Migrations

```bash
# Create migration
npm run migrate create migration_name

# Run migrations
npm run migrate
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

Documentation for deploying to production coming soon in `docs/DEPLOYMENT.md`.

## Contributing

1. Follow the tech stack
2. Use TypeScript for type safety
3. Write clear commit messages
4. Test before pushing
5. Create PR for review

## Security

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens for authentication
- HTTPS-only cookies for refresh tokens
- CORS configured for frontend domain
- Input validation with express-validator
- SQL injection prevention with parameterized queries

## Performance

- PostGIS for location-based queries
- Redis caching layer
- Connection pooling (20 connections)
- API rate limiting (100 req/15min)
- Gzip compression on responses
- CDN-ready static assets

## Roadmap

- [x] Phase 1: Authentication & Core Setup
- [ ] Phase 2: Service Discovery
- [ ] Phase 3: Booking System
- [ ] Phase 4: Reviews & Ratings
- [ ] Phase 5: Messaging (Real-time with Socket.io)
- [ ] Phase 6: Payment Processing (Stripe)
- [ ] Phase 7: Provider Features
- [ ] Phase 8: Admin Dashboard
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics
- [ ] Insurance/Verification Features

## License

MIT

## Support

For issues and questions, open an issue on GitHub.
