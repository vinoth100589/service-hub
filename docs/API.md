# ServiceHub API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 📝 Authentication Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}

Response 201:
{
  "message": "User registered successfully",
  "user": { "id": "...", "email": "..." },
  "access_token": "..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "message": "Login successful",
  "user": { ... },
  "access_token": "..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <TOKEN>

Response 200:
{ "user": { ... } }
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{ "refresh_token": "..." }

Response 200:
{ "access_token": "..." }
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Logout successful" }
```

---

## 🔍 Service Endpoints

### List Services (with filters)
```http
GET /services?category=plumbing&minPrice=100&maxPrice=500&minRating=4&sortBy=rating&limit=20&offset=0

Query Params:
  - category: string (optional)
  - minPrice: number (optional)
  - maxPrice: number (optional)
  - minRating: number 0-5 (default: 0)
  - latitude: number (for distance filtering)
  - longitude: number (for distance filtering)
  - radiusKm: number (default: 10)
  - sortBy: 'newest' | 'rating' | 'price-low' | 'price-high' | 'reviews' | 'nearest' (default: newest)
  - limit: number (default: 20)
  - offset: number (default: 0)

Response 200:
{
  "message": "Services retrieved successfully",
  "data": [ { "id": "...", "name": "...", "price": 150, "rating": 4.8, ... } ],
  "pagination": { "total": 100, "limit": 20, "offset": 0, "pages": 5 }
}
```

### Get Service Details
```http
GET /services/:serviceId

Response 200:
{
  "message": "Service retrieved successfully",
  "data": { ... },
  "recent_reviews": [ ... ]
}
```

### Nearby Services
```http
GET /services/nearby?latitude=40.7128&longitude=-74.0060&radiusKm=10&limit=50

Response 200:
{
  "message": "Nearby services retrieved successfully",
  "data": [ ... ],
  "pagination": { "total": 15 }
}
```

### Get Categories
```http
GET /services/categories

Response 200:
{
  "message": "Categories retrieved successfully",
  "data": [ "plumbing", "electrical", "cleaning", ... ]
}
```

### Get Featured Services
```http
GET /services/featured?limit=10

Response 200:
{
  "message": "Featured services retrieved successfully",
  "data": [ ... ]
}
```

### Create Service (Provider only)
```http
POST /services
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "Pipe Repair",
  "description": "Fix leaking pipes",
  "category": "plumbing",
  "subcategory": "repairs",
  "base_price": 150.00,
  "price_unit": "flat_rate",
  "duration_minutes": 60,
  "coverage_radius_km": 15,
  "images": [ "url1", "url2" ]
}

Response 201:
{ "message": "Service created successfully", "data": { ... } }
```

### Update Service (Provider only)
```http
PUT /services/:serviceId
Authorization: Bearer <TOKEN>
Content-Type: application/json

{ "name": "...", "description": "...", "base_price": 200 }

Response 200:
{ "message": "Service updated successfully", "data": { ... } }
```

### Delete Service (Provider only)
```http
DELETE /services/:serviceId
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Service deleted successfully" }
```

---

## 👤 Provider Endpoints

### Apply as Provider
```http
POST /providers/apply
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "business_name": "Mike's Plumbing",
  "business_description": "Professional plumbing services",
  "service_categories": [ "plumbing" ]
}

Response 201:
{ "message": "Provider application submitted successfully", "data": { ... } }
```

### Get Provider Profile
```http
GET /providers/profile
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Provider profile retrieved", "data": { ... } }
```

### Update Provider Settings
```http
PUT /providers/settings
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "business_name": "...",
  "response_time_minutes": 30
}

Response 200:
{ "message": "Provider settings updated", "data": { ... } }
```

### Update Availability
```http
PUT /providers/availability
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "availability": {
    "mon": { "start": "08:00", "end": "18:00" },
    "tue": { "start": "08:00", "end": "18:00" },
    ...
  }
}

Response 200:
{ "message": "Availability updated", "data": { ... } }
```

### Get Provider Profile (Public)
```http
GET /services/provider/:providerId/profile

Response 200:
{
  "message": "Provider profile retrieved successfully",
  "data": {
    "business_name": "...",
    "average_rating": 4.8,
    "services": [ ... ],
    "recent_reviews": [ ... ]
  }
}
```

---

## 📅 Booking Endpoints

### Create Booking
```http
POST /bookings
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "service_id": "service-uuid",
  "scheduled_date": "2024-01-15T10:00:00Z",
  "scheduled_duration_minutes": 60,
  "service_address": "123 Main St, New York, NY",
  "notes": "Please call before arriving"
}

Response 201:
{ "message": "Booking created", "data": { ... } }
```

### Get Booking
```http
GET /bookings/:bookingId
Authorization: Bearer <TOKEN>

Response 200:
{ "data": { ... } }
```

### List User Bookings
```http
GET /bookings?limit=20&offset=0
Authorization: Bearer <TOKEN>

Response 200:
{ "data": [ ... ] }
```

### Accept Booking (Provider only)
```http
PUT /bookings/:bookingId/accept
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Booking accepted", "data": { ... } }
```

### Reject Booking (Provider only)
```http
PUT /bookings/:bookingId/reject
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Booking rejected", "data": { ... } }
```

### Complete Booking
```http
PUT /bookings/:bookingId/complete
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Booking completed", "data": { ... } }
```

### Cancel Booking
```http
PUT /bookings/:bookingId/cancel
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Booking cancelled", "data": { ... } }
```

---

## ⭐ Review Endpoints

### Submit Review
```http
POST /reviews
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "rating": 5,
  "title": "Excellent service",
  "content": "Very professional and thorough",
  "cleanliness_rating": 5,
  "professionalism_rating": 5,
  "punctuality_rating": 4
}

Response 201:
{ "message": "Review submitted", "data": { ... } }
```

### Get Review
```http
GET /reviews/:reviewId

Response 200:
{ "data": { ... } }
```

### Update Review
```http
PUT /reviews/:reviewId
Authorization: Bearer <TOKEN>
Content-Type: application/json

{ "rating": 4, "content": "Updated review text" }

Response 200:
{ "message": "Review updated", "data": { ... } }
```

### Delete Review
```http
DELETE /reviews/:reviewId
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Review deleted" }
```

### List Provider Reviews
```http
GET /reviews/provider/:providerId?limit=20&offset=0

Response 200:
{ "data": [ ... ] }
```

---

## 💬 Message Endpoints

### Send Message
```http
POST /messages
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "receiver_id": "user-uuid",
  "content": "When can you come?",
  "file_url": "https://..."
}

Response 201:
{ "message": "Message sent", "data": { ... } }
```

### Get Booking Messages
```http
GET /messages/:bookingId?limit=50&offset=0
Authorization: Bearer <TOKEN>

Response 200:
{ "data": [ ... ] }
```

### Get Conversations
```http
GET /messages/conversations
Authorization: Bearer <TOKEN>

Response 200:
{ "data": [ { "booking_id": "...", "last_message": "...", "last_message_time": "..." } ] }
```

### Mark Message as Read
```http
PUT /messages/:messageId/read
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Message marked as read", "data": { ... } }
```

### Delete Message
```http
DELETE /messages/:messageId
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Message deleted" }
```

---

## 💳 Payment Endpoints

### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "amount": 150.00
}

Response 201:
{
  "message": "Payment intent created",
  "data": {
    "id": "payment-uuid",
    "amount": 150.00,
    "client_secret": "..."
  }
}
```

### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "payment_id": "payment-uuid",
  "stripe_charge_id": "ch_..."
}

Response 200:
{ "message": "Payment confirmed", "data": { ... } }
```

### Get Payment
```http
GET /payments/:paymentId
Authorization: Bearer <TOKEN>

Response 200:
{ "data": { ... } }
```

### List User Payments
```http
GET /payments?limit=20&offset=0
Authorization: Bearer <TOKEN>

Response 200:
{ "data": [ ... ] }
```

### Request Refund
```http
POST /payments/:paymentId/refund
Authorization: Bearer <TOKEN>

Response 200:
{ "message": "Refund processed", "data": { ... } }
```

### Get Payouts (Provider)
```http
GET /payments/provider/payouts
Authorization: Bearer <TOKEN>

Response 200:
{
  "data": [ ... ],
  "total_earnings": 5000.00
}
```

---

## 👨‍💼 Admin Endpoints

All admin endpoints require `Authorization: Bearer <TOKEN>` with admin user_type.

### Get Dashboard
```http
GET /admin/dashboard

Response 200:
{
  "data": {
    "total_customers": 150,
    "verified_providers": 45,
    "completed_bookings": 1200,
    "total_revenue": 50000.00
  }
}
```

### List Pending Providers
```http
GET /admin/providers/pending

Response 200:
{ "data": [ ... ] }
```

### Verify Provider
```http
PUT /admin/providers/:providerId/verify

Response 200:
{ "message": "Provider verified", "data": { ... } }
```

### Reject Provider
```http
PUT /admin/providers/:providerId/reject

Response 200:
{ "message": "Provider rejected", "data": { ... } }
```

### List Disputes
```http
GET /admin/disputes

Response 200:
{ "data": [ ... ] }
```

### Resolve Dispute
```http
PUT /admin/disputes/:disputeId/resolve
Content-Type: application/json

{
  "resolution": "Full refund issued",
  "refund_amount": 150.00
}

Response 200:
{ "message": "Dispute resolved", "data": { ... } }
```

### Get Analytics
```http
GET /admin/analytics

Response 200:
{
  "data": {
    "revenue_by_day": [ ... ],
    "bookings_by_status": [ ... ],
    "review_stats": { "avg_rating": 4.7, "total_reviews": 500 }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "errors": [
    { "param": "email", "msg": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{ "error": "Not authenticated" }
```

### 403 Forbidden
```json
{ "error": "Admin access required" }
```

### 404 Not Found
```json
{ "error": "Service not found" }
```

### 500 Server Error
```json
{ "error": "Internal server error message" }
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

- **100 requests per 15 minutes** per IP
- Rate limit headers included in response:
  - `RateLimit-Limit`
  - `RateLimit-Remaining`
  - `RateLimit-Reset`

---

## Testing

### Example Complete Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123456","first_name":"John","last_name":"Doe"}'

# 2. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123456"}'
# Copy access_token

# 3. List services
curl http://localhost:5000/api/v1/services \
  -H "Authorization: Bearer <TOKEN>"

# 4. Create booking
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"service_id":"...","scheduled_date":"2024-01-15T10:00:00Z","service_address":"123 Main St"}'
```

