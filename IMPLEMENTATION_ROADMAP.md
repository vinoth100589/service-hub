# ServiceHub Implementation Roadmap

## Phase 1: Authentication & Core Setup ✅ COMPLETE

### What's Done
- [x] Project structure
- [x] Database schema with PostGIS
- [x] User registration endpoint
- [x] User login endpoint
- [x] JWT token generation/verification
- [x] Authentication middleware
- [x] Environment configuration
- [x] Docker setup
- [x] Basic error handling

### Core Files Created
```
backend/
├── src/
│   ├── config/
│   │   ├── environment.ts      ✅
│   │   └── database.ts         ✅
│   ├── controllers/
│   │   └── authController.ts   ✅
│   ├── middleware/
│   │   └── auth.middleware.ts  ✅
│   ├── routes/
│   │   └── auth.routes.ts      ✅
│   ├── services/
│   │   └── authService.ts      ✅
│   ├── types/
│   │   └── express.d.ts        ✅
│   ├── utils/
│   │   ├── jwt.ts              ✅
│   │   └── passwordHash.ts     ✅
│   ├── app.ts                  ✅
│   └── index.ts                ✅
├── package.json                ✅
└── tsconfig.json               ✅

database/
└── schema/
    └── tables.sql              ✅

docker-compose.yml              ✅
```

### Testing Commands
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123456","first_name":"John","last_name":"Doe"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123456"}'

# Get current user (use token from login)
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Phase 2: Service Discovery 🚀 NEXT

### Effort: 85 hours (Frontend: 35h, Backend: 40h, Database: 10h)

### What to Build

#### 2.1 Service Model & Endpoints
**Backend Files to Create:**
```
backend/src/
├── controllers/
│   └── serviceController.ts        (NEW - 250 lines)
├── routes/
│   └── services.routes.ts          (NEW - 100 lines)
├── services/
│   ├── serviceService.ts           (NEW - 300 lines)
│   └── locationService.ts          (NEW - 150 lines, PostGIS queries)
└── models/
    └── Service.ts                  (NEW - types)
```

**API Endpoints to Implement:**
```
GET    /api/v1/services                    - List with filters
GET    /api/v1/services/:id                - Get one service
GET    /api/v1/services/nearby             - Distance-based search
POST   /api/v1/services                    - Create (provider only)
PUT    /api/v1/services/:id                - Update (provider only)
DELETE /api/v1/services/:id                - Delete (provider only)
GET    /api/v1/providers/:id               - Get provider profile
GET    /api/v1/providers/:id/services      - List provider services
GET    /api/v1/providers/:id/reviews       - Get provider reviews
```

#### 2.2 Filtering & Search
**Features:**
- Filter by category (plumbing, cleaning, repair, etc.)
- Filter by price range (min-max)
- Filter by rating (1-5 stars)
- Filter by distance (1km, 5km, 10km, 25km)
- Sort by: nearest, highest-rated, cheapest, most-reviews
- Search by service name/provider name

**Backend Implementation:**
- Use PostGIS `ST_DWithin()` for radius queries
- Index on `location_coverage` geometry
- Prepared statements for performance

#### 2.3 Location-Based Search
**Backend:**
- Implement `locationService.ts` with PostGIS queries
- Functions:
  - `findServicesNearby(lat, lng, radiusKm)`
  - `calculateDistance(lat1, lng1, lat2, lng2)`
  - `isLocationWithinServiceArea(lat, lng, serviceId)`

**Database Queries:**
```sql
-- Find services within 10km
SELECT services.* FROM services 
WHERE ST_DWithin(
  location_coverage, 
  ST_SetSRID(ST_Point($1, $2), 4326)::geography, 
  10000  -- 10km in meters
)
AND is_active = true;
```

#### 2.4 Frontend Components
**New Components:**
```
frontend/src/
├── pages/
│   ├── ServiceListPage.tsx         (NEW - 300 lines)
│   ├── ServiceDetailPage.tsx       (NEW - 400 lines)
│   └── HomePage.tsx                (NEW - 200 lines)
├── components/services/
│   ├── ServiceCard.tsx             (NEW - 150 lines)
│   ├── ServiceGrid.tsx             (NEW - 100 lines)
│   ├── ServiceFilters.tsx          (NEW - 250 lines)
│   ├── MapContainer.tsx            (NEW - 200 lines, Google Maps)
│   ├── ProviderCard.tsx            (NEW - 150 lines)
│   └── RatingStars.tsx             (NEW - 100 lines)
├── hooks/
│   ├── useServices.ts              (NEW - 150 lines)
│   └── useLocation.ts              (NEW - 100 lines)
├── services/
│   ├── serviceService.ts           (NEW - 100 lines, API calls)
│   └── locationService.ts          (NEW - 100 lines, geolocation)
└── store/
    └── servicesSlice.ts            (NEW - 150 lines, Zustand)
```

**UI/UX:**
- Service listing page with grid layout
- Filter sidebar with collapsible sections
- Map view toggle
- Service cards with:
  - Image carousel
  - Price
  - Rating stars
  - Provider name & badge
  - Distance indicator
  - Quick booking button
- Service detail modal with full info
- Provider profile card
- Similar services carousel

#### 2.5 Testing Requirements
- [ ] POST /services with valid data → creates service
- [ ] GET /services → returns paginated list
- [ ] GET /services?category=plumbing → filters by category
- [ ] GET /services?minPrice=100&maxPrice=500 → filters by price
- [ ] GET /services?rating=4 → filters by minimum rating
- [ ] GET /services/nearby?lat=40.7128&lng=-74.0060&radius=10 → location search
- [ ] GET /services/:id → returns service with provider info
- [ ] PUT /services/:id → updates service (provider only)
- [ ] DELETE /services/:id → deletes service (provider only)

### Implementation Steps

1. **Create Service Model** (30 min)
   - Define TypeScript interfaces
   - Database queries

2. **Create Service Controller** (1.5 hours)
   - List endpoint with filters
   - Detail endpoint
   - Create/update/delete (with auth)

3. **Create Location Service** (2 hours)
   - PostGIS queries
   - Distance calculations
   - Nearby search

4. **Frontend Service API Client** (1 hour)
   - axios setup
   - Type-safe API calls

5. **Create Frontend Components** (8 hours)
   - Service list page
   - Filters sidebar
   - Service card
   - Service detail view
   - Map integration

6. **Wire Up Frontend Hooks** (2 hours)
   - useServices custom hook
   - useLocation hook
   - State management

7. **Testing & Debugging** (3 hours)
   - API endpoint testing
   - Frontend integration
   - Filter functionality

### Checklist for Phase 2
- [ ] Database indexes created
- [ ] Service controller implemented
- [ ] All filter logic working
- [ ] PostGIS queries tested
- [ ] Frontend list page rendering
- [ ] Filters connected to API
- [ ] Map integration working
- [ ] Provider profiles visible
- [ ] All tests passing

---

## Phase 3: Booking System 📅

### Effort: 95 hours

**Files to Create:**
```
backend/src/
├── controllers/
│   └── bookingController.ts
├── routes/
│   └── bookings.routes.ts
├── services/
│   └── bookingService.ts
└── models/
    └── Booking.ts

frontend/src/
├── pages/
│   ├── BookingPage.tsx
│   └── BookingStatusPage.tsx
├── components/booking/
│   ├── BookingForm.tsx
│   ├── BookingStatus.tsx
│   ├── BookingHistory.tsx
│   └── BookingTimeline.tsx
└── hooks/
    └── useBooking.ts
```

**API Endpoints:**
```
POST   /api/v1/bookings                  - Create booking
GET    /api/v1/bookings/:id              - Get booking details
GET    /api/v1/bookings                  - List user bookings
PUT    /api/v1/bookings/:id/accept       - Accept (provider)
PUT    /api/v1/bookings/:id/reject       - Reject (provider)
PUT    /api/v1/bookings/:id/cancel       - Cancel
PUT    /api/v1/bookings/:id/complete     - Mark complete
GET    /api/v1/bookings/:id/history      - Get timeline
```

**State Flow:**
```
requested → (24h to respond)
  → [accepted → in_progress → completed]
  → [rejected]
  → [cancelled]
```

---

## Phase 4: Reviews & Ratings ⭐

### Effort: 58 hours

**Files to Create:**
```
backend/src/
├── controllers/
│   └── reviewController.ts
├── routes/
│   └── reviews.routes.ts
├── services/
│   └── reviewService.ts
└── models/
    └── Review.ts

frontend/src/
├── pages/
│   └── ReviewsPage.tsx
├── components/reviews/
│   ├── ReviewForm.tsx
│   ├── ReviewCard.tsx
│   ├── RatingStars.tsx
│   └── ReviewList.tsx
└── hooks/
    └── useReviews.ts
```

**API Endpoints:**
```
POST   /api/v1/reviews                     - Submit review
GET    /api/v1/reviews/:id                 - Get review
PUT    /api/v1/reviews/:id                 - Update review
DELETE /api/v1/reviews/:id                 - Delete review
GET    /api/v1/providers/:id/reviews       - List provider reviews
POST   /api/v1/reviews/:id/helpful         - Mark helpful
```

---

## Phase 5: Messaging 💬

### Effort: 93 hours (includes real-time with Socket.io)

**Files to Create:**
```
backend/src/
├── controllers/
│   └── messageController.ts
├── routes/
│   └── messages.routes.ts
├── services/
│   └── messagingService.ts
├── models/
│   └── Message.ts
└── websocket/
    ├── socket.ts
    └── handlers/
        ├── messagingHandler.ts
        └── notificationHandler.ts

frontend/src/
├── pages/
│   └── MessagingPage.tsx
├── components/messaging/
│   ├── ChatWindow.tsx
│   ├── ChatList.tsx
│   ├── MessageBubble.tsx
│   └── MessageInput.tsx
├── hooks/
│   └── useMessaging.ts
└── lib/
    └── socket.io.ts
```

**Real-Time Features:**
- Instant message delivery
- Typing indicators
- Read receipts
- Online/offline status
- Connection resilience

---

## Phase 6: Payment Processing 💳

### Effort: 95 hours

**Files to Create:**
```
backend/src/
├── controllers/
│   └── paymentController.ts
├── routes/
│   └── payments.routes.ts
├── services/
│   ├── paymentService.ts
│   └── stripeService.ts
├── models/
│   └── Payment.ts
├── queue/
│   ├── payoutQueue.ts
│   └── workers/
│       └── payoutWorker.ts
└── config/
    └── stripe.ts

frontend/src/
├── pages/
│   └── PaymentPage.tsx
├── components/payment/
│   ├── PaymentForm.tsx
│   ├── PaymentStatus.tsx
│   └── PaymentHistory.tsx
├── hooks/
│   └── usePayment.ts
└── lib/
    └── stripe.ts
```

**Stripe Integration:**
- Payment intents
- Webhook handling
- Idempotent requests
- Refund handling
- Commission calculation
- Weekly payouts via Stripe Connect

---

## Phase 7: Provider Features 👷

### Effort: 75 hours

**Files to Create:**
```
backend/src/
├── controllers/
│   ├── providerController.ts
│   └── analyticsController.ts
├── routes/
│   ├── providers.routes.ts
│   └── analytics.routes.ts
├── services/
│   ├── providerService.ts
│   └── analyticsService.ts
└── models/
    └── Provider.ts

frontend/src/
├── pages/
│   ├── ProviderDashboard.tsx
│   └── ProviderSettings.tsx
├── components/provider/
│   ├── EarningsChart.tsx
│   ├── BookingsList.tsx
│   ├── ServiceManager.tsx
│   ├── AvailabilityCalendar.tsx
│   └── PayoutHistory.tsx
└── hooks/
    └── useProviderDashboard.ts
```

**Features:**
- Earnings dashboard
- Service management
- Availability calendar
- Response time metrics
- Cancellation rate tracking
- Payout history

---

## Phase 8: Admin Dashboard 👨‍💼

### Effort: 95 hours

**Files to Create:**
```
backend/src/
├── controllers/
│   └── adminController.ts
├── routes/
│   └── admin.routes.ts
├── services/
│   └── adminService.ts
└── models/
    └── Dispute.ts

frontend/src/
├── pages/
│   └── AdminDashboard.tsx
├── components/admin/
│   ├── StatsCards.tsx
│   ├── ProviderVerification.tsx
│   ├── UserManagement.tsx
│   ├── DisputeCenter.tsx
│   ├── AnalyticsCharts.tsx
│   └── ReportGenerator.tsx
└── hooks/
    └── useAdminDashboard.ts
```

**Features:**
- KPI dashboard
- Provider verification queue
- User management
- Dispute resolution
- Analytics & reporting
- Revenue tracking

---

## Implementation Statistics

| Phase | Frontend (hrs) | Backend (hrs) | Database (hrs) | Total | Status |
|-------|---|---|---|---|---|
| 1: Auth | 20 | 30 | 5 | 55 | ✅ DONE |
| 2: Discovery | 35 | 40 | 10 | 85 | 🚀 NEXT |
| 3: Booking | 30 | 50 | 15 | 95 | 📅 |
| 4: Reviews | 20 | 30 | 8 | 58 | ⭐ |
| 5: Messaging | 40 | 45 | 8 | 93 | 💬 |
| 6: Payment | 25 | 60 | 10 | 95 | 💳 |
| 7: Provider | 35 | 35 | 5 | 75 | 👷 |
| 8: Admin | 40 | 50 | 5 | 95 | 👨‍💼 |
| **TOTAL MVP** | **275** | **420** | **76** | **771** | |

**Timeline:** 16-20 weeks with one developer, 8-10 weeks with 2 developers

---

## Development Tips

### Creating Database Migrations
```sql
-- database/migrations/003_add_new_column.sql
ALTER TABLE bookings ADD COLUMN special_notes TEXT;
```

### Adding a New API Endpoint
1. Create controller method
2. Create route definition
3. Add to routes/index.ts
4. Test with curl
5. Add frontend hook

### Testing API Changes
```bash
# Watch backend logs
docker-compose logs -f backend

# Test endpoint
curl -X GET http://localhost:5000/api/v1/endpoint \
  -H "Authorization: Bearer TOKEN"
```

### Frontend Development
```bash
# Components reload on save (HMR enabled)
# Check browser console for errors
# Use React DevTools browser extension
```

---

## Git Workflow for Each Phase

```bash
# Start new phase
git checkout -b phase-2-service-discovery

# Commit regularly
git add .
git commit -m "feat: add service listing endpoint"

# Merge when phase is complete
git checkout main
git merge phase-2-service-discovery
git tag v0.2.0
```

---

## Quality Checklist for Each Phase

- [ ] All endpoints tested with curl/Postman
- [ ] Frontend components built and styled
- [ ] Integration between frontend and backend works
- [ ] No console errors in browser
- [ ] Database migrations applied cleanly
- [ ] TypeScript types are complete (no `any`)
- [ ] Code is readable and documented
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Tests passing (for completed phases)

---

## Next Action

👉 **Start Phase 2: Service Discovery**

See Phase 2 details above for files to create and endpoints to implement.
