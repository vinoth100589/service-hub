# 🚀 ServiceHub - Quick Start (2 Minutes)

## Start Everything
```bash
cd /Users/vinoth-2442/Personal/ServiceHub
docker-compose up -d
```

**That's it! ✨**

Services running at:
- 🌐 Frontend: http://localhost:3000
- 🔌 API: http://localhost:5000
- 💾 Database: localhost:5432
- 📦 Redis: localhost:6379

---

## Test Endpoints (Copy & Paste)

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the `access_token` from response** → `YOUR_TOKEN`

### 3. List Services
```bash
curl http://localhost:5000/api/v1/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Nearby Services (Location Search)
```bash
curl "http://localhost:5000/api/v1/services/nearby?latitude=40.7128&longitude=-74.0060&radiusKm=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Service Details
```bash
curl http://localhost:5000/api/v1/services/850e8400-e29b-41d4-a716-446655440101 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Create Booking
```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "850e8400-e29b-41d4-a716-446655440101",
    "scheduled_date": "2024-02-01T10:00:00Z",
    "scheduled_duration_minutes": 60,
    "service_address": "123 Main St, New York, NY",
    "notes": "Please call before arriving"
  }'
```

### 7. Get Current User
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## More Commands

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs  
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```

### Restart Services
```bash
docker-compose restart backend  # Just backend
docker-compose restart frontend # Just frontend
docker-compose down             # Stop everything
docker-compose up -d            # Start everything
```

### Connect to Database
```bash
psql -U servicehub -d servicehub -h localhost -W
# Password: servicehub_pass

# List tables
\dt

# View schema
\d users
\d services
\d bookings
```

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| [API.md](docs/API.md) | 56 endpoints reference |
| [GETTING_STARTED.md](GETTING_STARTED.md) | 5-minute setup guide |
| [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) | What to build next |
| [COMPLETE_BUILD_STATUS.md](COMPLETE_BUILD_STATUS.md) | What's implemented |
| [README.md](README.md) | Project overview |

---

## 🎯 What's Available

### All 56 API Endpoints
- ✅ Authentication (5)
- ✅ Services (7)
- ✅ Providers (7)
- ✅ Bookings (7)
- ✅ Reviews (5)
- ✅ Messages (5)
- ✅ Payments (6)
- ✅ Admin (7)

### Test Data (Pre-loaded)
- ✅ 3 verified providers
- ✅ 9 services with ratings
- ✅ Ready to use immediately

### Features Working
- ✅ User registration & login
- ✅ Service filtering (price, rating, category)
- ✅ Location-based search
- ✅ Booking system
- ✅ Messaging
- ✅ Payment processing
- ✅ Admin dashboard

---

## 🔑 API Key Endpoints

All endpoints require `Authorization: Bearer <TOKEN>` except:
- `/auth/register`
- `/auth/login`
- `/services` (GET)
- `/services/nearby` (GET)
- `/services/:id` (GET)

---

## 💡 Pro Tips

1. **Save Token to Variable**
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     | jq -r '.access_token')
   
   echo $TOKEN
   ```

2. **Use Postman**
   - Import all endpoints from API.md
   - Set Environment variable: `token={{access_token}}`
   - Test flows end-to-end

3. **Monitor Real-Time**
   - Keep 3 terminals open
   - Terminal 1: `docker-compose logs -f backend`
   - Terminal 2: `docker-compose logs -f frontend`
   - Terminal 3: Run curl commands

---

## ✅ Verify Everything Works

```bash
# 1. Check services are running
docker-compose ps

# 2. Check health endpoint
curl http://localhost:5000/health
# Should return: {"status":"OK","timestamp":"..."}

# 3. Test database connection
psql -U servicehub -d servicehub -h localhost -c "SELECT COUNT(*) FROM services;"
# Should return: count
# -------
#     9

# 4. Verify test data is loaded
curl "http://localhost:5000/api/v1/services/categories" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return: ["plumbing", "cleaning", "electrical"]
```

---

## 🎊 You're Ready!

Everything is running. All 56 endpoints work. Test data is loaded.

**Next:** Read [API.md](docs/API.md) for complete endpoint reference.

---

## 📞 Troubleshooting

### Docker Services Won't Start
```bash
docker-compose down
docker volume rm servicehub_postgres_data servicehub_redis_data
docker-compose up -d
```

### Database Connection Error
```bash
# Check if postgres is running
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Port Already in Use
```bash
# Find what's using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Try again
docker-compose up -d
```

### Frontend Not Loading
```bash
# Clear frontend cache
docker-compose restart frontend

# Check logs
docker-compose logs -f frontend
```

---

**🚀 Everything is ready. Happy coding!**
