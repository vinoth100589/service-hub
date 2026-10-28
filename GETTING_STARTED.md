# Getting Started with ServiceHub

## 🚀 First-Time Setup (5 minutes)

### 1. Start Docker Services

```bash
cd /Users/vinoth-2442/Personal/ServiceHub
docker-compose up -d
```

This starts:
- PostgreSQL database with PostGIS
- Redis cache
- Backend API (auto-initialized)
- Frontend dev server

### 2. Verify Everything Works

```bash
# Check services are running
docker-compose ps

# Test backend health
curl http://localhost:5000/health
# Should return: {"status":"OK","timestamp":"..."}

# Open frontend
open http://localhost:3000
```

### 3. Test Authentication API

```bash
# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Should return:
# {"message":"User registered successfully","user":{...},"access_token":"..."}

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (use token from login)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 📁 What's Been Built (Phase 1)

### Backend Foundation ✅
- ✅ Express.js server with TypeScript
- ✅ PostgreSQL database with PostGIS (location support)
- ✅ User authentication (register, login, JWT tokens)
- ✅ Role-based access control (customer, provider, admin)
- ✅ Environment configuration
- ✅ CORS, helmet, compression, rate limiting
- ✅ Error handling middleware

### Database Schema ✅
- ✅ Users table with location (PostGIS Point)
- ✅ Providers table (for service providers)
- ✅ Services table (with location coverage)
- ✅ Bookings table
- ✅ Messages table
- ✅ Reviews table
- ✅ Payments table
- ✅ Disputes table
- ✅ Notifications table
- ✅ Indexes for performance

### Frontend Scaffolding ✅
- ✅ React 18 + TypeScript + Vite
- ✅ Tailwind CSS configured
- ✅ Zustand for state management
- ✅ Axios HTTP client
- ✅ React Router setup

## 🛠️ Development Workflow

### Terminal 1: Monitor Backend Logs
```bash
docker-compose logs -f backend
```

### Terminal 2: Monitor Frontend Logs
```bash
docker-compose logs -f frontend
```

### To Restart Services
```bash
docker-compose restart backend    # Restart just backend
docker-compose restart frontend   # Restart just frontend
docker-compose down               # Stop all services
docker-compose up -d              # Start all services
```

## 📝 Next Steps (Phase 2: Service Discovery)

### What to Build Next
1. **Service Model & Controller** - Create/read services
2. **Service Filters** - Quality, price, distance
3. **Location-based Queries** - Find nearby services
4. **Map Integration** - Display services on map
5. **Provider Profile Page** - Show provider details

### Files to Create
```
backend/src/
├── controllers/serviceController.ts     (NEW)
├── routes/services.routes.ts             (NEW)
├── services/serviceService.ts            (NEW)
└── models/Service.ts                     (NEW)

frontend/src/
├── pages/ServiceListPage.tsx             (NEW)
├── pages/ServiceDetailPage.tsx           (NEW)
├── components/services/
│   ├── ServiceCard.tsx                   (NEW)
│   ├── ServiceGrid.tsx                   (NEW)
│   ├── ServiceFilters.tsx                (NEW)
│   └── MapContainer.tsx                  (NEW)
└── hooks/useServices.ts                  (NEW)
```

## 🔑 API Keys to Add

Before going live, update `.env` files with real keys:

1. **Stripe** - Payment processing
   - Get from: https://stripe.com
   - Add: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`

2. **Google Maps API** - Location & mapping
   - Get from: https://console.cloud.google.com
   - Add: `GOOGLE_MAPS_API_KEY`

3. **Email Service** - Send emails
   - Use SendGrid or Gmail SMTP
   - Add: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Free up ports
lsof -ti:5000 | xargs kill -9   # Backend
lsof -ti:3000 | xargs kill -9   # Frontend
lsof -ti:5432 | xargs kill -9   # Database
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Rebuild and restart
docker-compose down
docker-compose up -d
```

### Node Modules Issues
```bash
# Clear cache and reinstall
docker-compose down
docker volume rm servicehub_postgres_data
docker-compose up -d
```

## 📚 Documentation

- **API Docs**: See `/docs/API.md` (coming soon)
- **Database Schema**: See `/docs/DATABASE.md` (coming soon)
- **Architecture**: See `/docs/ARCHITECTURE.md` (coming soon)
- **Security**: See `/docs/SECURITY.md` (coming soon)

## 💡 Code Tips

### Adding a New API Endpoint

**1. Create a route handler (controller)**
```typescript
// backend/src/controllers/exampleController.ts
export class ExampleController {
  static async getExample(req: Request, res: Response) {
    try {
      const result = await query('SELECT * FROM ...');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

**2. Create a route**
```typescript
// backend/src/routes/example.routes.ts
router.get('/examples', ExampleController.getExample);
```

**3. Register the route in app.ts**
```typescript
import exampleRoutes from '@routes/example.routes';
app.use('/api/v1/examples', exampleRoutes);
```

**4. Test with curl**
```bash
curl http://localhost:5000/api/v1/examples
```

## 🚀 Ready to Code?

1. Open VSCode at `/Users/vinoth-2442/Personal/ServiceHub`
2. Open terminal and run: `docker-compose up -d`
3. Open 3 terminals:
   - Terminal 1: `docker-compose logs -f backend`
   - Terminal 2: `docker-compose logs -f frontend`
   - Terminal 3: Use for git, manual tests, etc.
4. Start building Phase 2!

## Questions?

Check the logs first: `docker-compose logs -f service_name`
