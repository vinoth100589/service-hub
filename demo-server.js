#!/usr/bin/env node

/**
 * ServiceHub Demo Server - Mock API with Dummy Data
 * This demonstrates all 56 API endpoints with hardcoded data
 * No external dependencies - pure Node.js
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Mock database with dummy data
const mockData = {
  users: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'john@test.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      user_type: 'customer',
      verified_email: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'emma@test.com',
      password: 'password123',
      first_name: 'Emma',
      last_name: 'Wilson',
      user_type: 'customer',
      verified_email: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      email: 'mike@plumbing.com',
      password: 'password123',
      first_name: 'Mike',
      last_name: 'Johnson',
      user_type: 'provider',
      verified_email: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      email: 'sarah@electric.com',
      password: 'password123',
      first_name: 'Sarah',
      last_name: 'Miller',
      user_type: 'provider',
      verified_email: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440103',
      email: 'maria@cleaning.com',
      password: 'password123',
      first_name: 'Maria',
      last_name: 'Garcia',
      user_type: 'provider',
      verified_email: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440900',
      email: 'admin@servicehub.com',
      password: 'admin123',
      first_name: 'Ava',
      last_name: 'Admin',
      user_type: 'admin',
      verified_email: true,
    },
  ],
  providers: [
    {
      id: '750e8400-e29b-41d4-a716-446655440101',
      user_id: '550e8400-e29b-41d4-a716-446655440101',
      business_name: "Mike's Plumbing",
      average_rating: 4.8,
      total_reviews: 120,
      total_bookings: 250,
      verification_status: 'verified',
      latitude: 40.7484,
      longitude: -73.9857,
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440102',
      user_id: '550e8400-e29b-41d4-a716-446655440102',
      business_name: "Sarah's Electric",
      average_rating: 4.9,
      total_reviews: 95,
      total_bookings: 180,
      verification_status: 'verified',
      latitude: 40.7580,
      longitude: -73.9776,
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440103',
      user_id: '550e8400-e29b-41d4-a716-446655440103',
      business_name: "Maria's Cleaning Service",
      average_rating: 4.7,
      total_reviews: 150,
      total_bookings: 320,
      verification_status: 'verified',
      latitude: 40.7505,
      longitude: -73.9654,
    },
  ],
  services: [
    {
      id: '850e8400-e29b-41d4-a716-446655440101',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      name: 'Pipe Repair',
      description: 'Fix leaking pipes and water issues quickly and professionally',
      category: 'plumbing',
      base_price: 150,
      rating: 4.8,
      review_count: 85,
      images: [],
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440102',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      name: 'Drain Cleaning',
      description: 'Fast and effective drain cleaning service',
      category: 'plumbing',
      base_price: 120,
      rating: 4.9,
      review_count: 102,
      images: [],
      created_at: '2026-08-05T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440103',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      name: 'Toilet Installation',
      description: 'Professional toilet installation and repair',
      category: 'plumbing',
      base_price: 200,
      rating: 4.7,
      review_count: 35,
      images: [],
      created_at: '2026-08-10T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440104',
      provider_id: '750e8400-e29b-41d4-a716-446655440102',
      name: 'Electrical Repair',
      description: 'Diagnose and fix electrical problems safely',
      category: 'electrical',
      base_price: 100,
      rating: 4.9,
      review_count: 67,
      images: [],
      created_at: '2026-08-12T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440105',
      provider_id: '750e8400-e29b-41d4-a716-446655440102',
      name: 'Outlet Installation',
      description: 'Install new electrical outlets safely',
      category: 'electrical',
      base_price: 150,
      rating: 4.8,
      review_count: 28,
      images: [],
      created_at: '2026-08-15T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440106',
      provider_id: '750e8400-e29b-41d4-a716-446655440102',
      name: 'Panel Upgrade',
      description: 'Upgrade electrical panel for modern homes',
      category: 'electrical',
      base_price: 800,
      rating: 4.9,
      review_count: 12,
      images: [],
      created_at: '2026-08-18T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440107',
      provider_id: '750e8400-e29b-41d4-a716-446655440103',
      name: 'House Cleaning',
      description: 'Thorough house cleaning service, eco-friendly products',
      category: 'cleaning',
      base_price: 150,
      rating: 4.7,
      review_count: 98,
      images: [],
      created_at: '2026-08-20T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440108',
      provider_id: '750e8400-e29b-41d4-a716-446655440103',
      name: 'Office Cleaning',
      description: 'Professional office cleaning and maintenance',
      category: 'cleaning',
      base_price: 200,
      rating: 4.8,
      review_count: 45,
      images: [],
      created_at: '2026-08-22T00:00:00Z',
    },
    {
      id: '850e8400-e29b-41d4-a716-446655440109',
      provider_id: '750e8400-e29b-41d4-a716-446655440103',
      name: 'Window Cleaning',
      description: 'Streak-free window cleaning inside and out',
      category: 'cleaning',
      base_price: 75,
      rating: 4.6,
      review_count: 7,
      images: [],
      created_at: '2026-08-24T00:00:00Z',
    },
  ],
  bookings: [
    {
      id: 'b1',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      service_id: '850e8400-e29b-41d4-a716-446655440101',
      status: 'completed',
      scheduled_date: '2024-01-15T10:00:00Z',
      service_address: '123 Main St, New York, NY',
      notes: 'Please call before arriving',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b2',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      provider_id: '750e8400-e29b-41d4-a716-446655440102',
      service_id: '850e8400-e29b-41d4-a716-446655440104',
      status: 'pending',
      scheduled_date: '2026-09-05T14:00:00Z',
      service_address: '45 Elm St, New York, NY',
      notes: 'Outlet sparking near the kitchen',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b3',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      provider_id: '750e8400-e29b-41d4-a716-446655440103',
      service_id: '850e8400-e29b-41d4-a716-446655440107',
      status: 'accepted',
      scheduled_date: '2026-09-03T09:00:00Z',
      service_address: '78 Oak Ave, New York, NY',
      notes: 'Two bedroom apartment',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b4',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      service_id: '850e8400-e29b-41d4-a716-446655440102',
      status: 'cancelled',
      scheduled_date: '2026-08-20T11:00:00Z',
      service_address: '78 Oak Ave, New York, NY',
      notes: 'Rescheduling needed',
      created_at: new Date().toISOString(),
    },
    {
      id: 'b5',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      service_id: '850e8400-e29b-41d4-a716-446655440101',
      status: 'completed',
      scheduled_date: '2026-08-10T10:00:00Z',
      service_address: '78 Oak Ave, New York, NY',
      notes: '',
      created_at: new Date().toISOString(),
    },
  ],
  reviews: [
    {
      id: 'r1',
      booking_id: 'b1',
      reviewer_id: '550e8400-e29b-41d4-a716-446655440001',
      reviewee_id: '550e8400-e29b-41d4-a716-446655440101',
      rating: 5,
      title: 'Excellent service',
      content: 'Very professional and thorough',
      helpful_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'r2',
      booking_id: 'b5',
      reviewer_id: '550e8400-e29b-41d4-a716-446655440002',
      reviewee_id: '550e8400-e29b-41d4-a716-446655440101',
      rating: 4,
      title: 'Quick and reliable',
      content: 'Fixed the pipe in under an hour',
      helpful_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'r3',
      booking_id: 'b3',
      reviewer_id: '550e8400-e29b-41d4-a716-446655440002',
      reviewee_id: '550e8400-e29b-41d4-a716-446655440103',
      rating: 5,
      title: 'Spotless!',
      content: 'Maria did an amazing job cleaning the whole apartment',
      helpful_count: 0,
      created_at: new Date().toISOString(),
    },
  ],
  messages: [
    {
      id: 'm1',
      booking_id: 'b1',
      sender_id: '550e8400-e29b-41d4-a716-446655440001',
      receiver_id: '550e8400-e29b-41d4-a716-446655440101',
      content: 'When can you come?',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      booking_id: 'b2',
      sender_id: '550e8400-e29b-41d4-a716-446655440001',
      receiver_id: '550e8400-e29b-41d4-a716-446655440102',
      content: 'Is tomorrow afternoon still ok?',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm3',
      booking_id: 'b3',
      sender_id: '550e8400-e29b-41d4-a716-446655440002',
      receiver_id: '550e8400-e29b-41d4-a716-446655440103',
      content: 'Please bring eco-friendly products',
      created_at: new Date().toISOString(),
    },
  ],
  payments: [
    {
      id: 'p1',
      booking_id: 'b1',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      amount: 150,
      status: 'completed',
      fee_amount: 22.5,
      provider_payout_amount: 127.5,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    },
    {
      id: 'p2',
      booking_id: 'b5',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      provider_id: '750e8400-e29b-41d4-a716-446655440101',
      amount: 150,
      status: 'completed',
      fee_amount: 22.5,
      provider_payout_amount: 127.5,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    },
    {
      id: 'p3',
      booking_id: 'b3',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      provider_id: '750e8400-e29b-41d4-a716-446655440103',
      amount: 150,
      status: 'pending',
      fee_amount: 22.5,
      provider_payout_amount: 127.5,
      created_at: new Date().toISOString(),
      processed_at: null,
    },
  ],
  disputes: [],
  notifications: [],
  favorites: [],
  promoCodes: [
    {
      id: 'promo1',
      code: 'WELCOME10',
      description: '10% off your first booking',
      discount_type: 'percent',
      discount_value: 10,
      max_discount_amount: 30,
      min_booking_amount: null,
      max_redemptions: null,
      redemption_count: 0,
      max_redemptions_per_user: 1,
      valid_until: null,
      is_active: true,
    },
    {
      id: 'promo2',
      code: 'SAVE20',
      description: '$20 off bookings of $50+',
      discount_type: 'fixed',
      discount_value: 20,
      max_discount_amount: null,
      min_booking_amount: 50,
      max_redemptions: null,
      redemption_count: 0,
      max_redemptions_per_user: 1,
      valid_until: null,
      is_active: true,
    },
  ],
  promoRedemptions: [],
};

// Tracks which users have voted a review helpful: Map<reviewId, Set<userId>>
const reviewHelpfulVotes = new Map();

// Mock tokens
const tokens = new Map();

// Password-reset tokens: Map<token, { userId, expires }>
const resetTokens = new Map();

// Email-verification tokens: Map<token, { userId, expires }>
const verifyEmailTokens = new Map();

function issueVerificationLink(user) {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  verifyEmailTokens.set(verifyToken, { userId: user.id, expires: Date.now() + 24 * 3600000 });
  return `http://localhost:3000/verify-email?token=${verifyToken}`;
}

// JWT-like token generator
function generateToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { userId, expires: Date.now() + 3600000 }); // 1 hour
  return token;
}

function verifyToken(token) {
  const session = tokens.get(token);
  if (!session || session.expires < Date.now()) return null;
  return session.userId;
}

// Returns the authenticated admin user, or null (caller sends 401/403)
function requireAdmin(req) {
  const token = req.headers.authorization?.split(' ')[1];
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = mockData.users.find(u => u.id === userId);
  return user && user.user_type === 'admin' ? user : null;
}

// Mirrors the real backend's computeDiscount: validates a promo code against
// a booking amount for a given user, returning { promo, discount } or
// throwing an Error with a user-facing message. Shared by /promos/validate
// (preview only) and the actual redemption in POST /payments/intent.
function computeDiscount(code, userId, bookingAmount) {
  const promo = mockData.promoCodes.find(p => p.code === code.trim().toUpperCase() && p.is_active);
  if (!promo) throw new Error('Invalid promo code');

  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    throw new Error('This promo code has expired');
  }
  if (promo.max_redemptions !== null && promo.redemption_count >= promo.max_redemptions) {
    throw new Error('This promo code has reached its redemption limit');
  }
  if (promo.min_booking_amount && bookingAmount < promo.min_booking_amount) {
    throw new Error(`This code requires a minimum booking of $${promo.min_booking_amount}`);
  }

  const userRedemptions = mockData.promoRedemptions.filter(
    r => r.promo_code_id === promo.id && r.user_id === userId
  ).length;
  if (userRedemptions >= promo.max_redemptions_per_user) {
    throw new Error("You've already used this promo code");
  }

  let discount =
    promo.discount_type === 'percent' ? bookingAmount * (promo.discount_value / 100) : promo.discount_value;
  if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount);
  discount = Math.min(Number(discount.toFixed(2)), bookingAmount);

  return { promo, discount };
}

// Local-disk storage for uploaded images, matching the real backend's dev
// setup — no S3/cloud dependency needed to demo the feature.
const UPLOAD_DIR = path.join(__dirname, 'demo-uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
};

// Hand-rolled multipart/form-data parser — this server has zero dependencies
// by design, so no `multer`/`busboy` is available. Splits the raw request
// body (a Buffer, not a string — binary-safe) on the boundary from the
// Content-Type header and extracts each part's headers + content.
function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) throw new Error('Missing multipart boundary');
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);

  const fields = {};
  const files = [];
  let start = buffer.indexOf(boundary) + boundary.length;

  while (start < buffer.length) {
    const nextBoundary = buffer.indexOf(boundary, start);
    if (nextBoundary === -1) break;
    let part = buffer.slice(start, nextBoundary);
    // Trim the leading CRLF after the boundary and trailing CRLF before the next one
    if (part.slice(0, 2).toString() === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headerText = part.slice(0, headerEnd).toString('utf8');
      const content = part.slice(headerEnd + 4);

      const nameMatch = headerText.match(/name="([^"]+)"/);
      const filenameMatch = headerText.match(/filename="([^"]*)"/);
      const typeMatch = headerText.match(/Content-Type:\s*(\S+)/i);

      if (nameMatch) {
        if (filenameMatch && filenameMatch[1]) {
          files.push({
            fieldname: nameMatch[1],
            filename: filenameMatch[1],
            contentType: typeMatch ? typeMatch[1] : 'application/octet-stream',
            buffer: content,
          });
        } else {
          fields[nameMatch[1]] = content.toString('utf8');
        }
      }
    }
    start = nextBoundary + boundary.length;
    if (buffer.slice(start, start + 2).toString() === '--') break; // final boundary
  }

  return { fields, files };
}

function saveUploadedFile(file) {
  const ext = path.extname(file.filename).toLowerCase() || '.png';
  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return filename;
}

// Demo only: strips the plaintext password before a user object leaves the server
function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// Haversine distance in km between two lat/lng points
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function enrichWithProvider(service) {
  const provider = mockData.providers.find(p => p.id === service.provider_id);
  return { ...service, provider };
}

// Enriches a booking with service/provider/customer display fields and the
// requesting user's role in it (mirrors the real backend's shape).
function enrichBooking(booking, viewerId) {
  const service = mockData.services.find(s => s.id === booking.service_id);
  const provider = mockData.providers.find(p => p.id === booking.provider_id);
  const customer = mockData.users.find(u => u.id === booking.user_id);
  return {
    ...booking,
    name: service ? service.name : undefined,
    base_price: service ? service.base_price : undefined,
    business_name: provider ? provider.business_name : undefined,
    provider_user_id: provider ? provider.user_id : undefined,
    customer_first_name: customer ? customer.first_name : undefined,
    customer_last_name: customer ? customer.last_name : undefined,
    viewer_role: booking.user_id === viewerId ? 'customer' : 'provider',
  };
}

function isBookingParticipant(booking, userId) {
  if (booking.user_id === userId) return true;
  const provider = mockData.providers.find(p => p.id === booking.provider_id);
  return !!provider && provider.user_id === userId;
}

function createNotification(userId, type, title, content, relatedEntityId) {
  mockData.notifications.push({
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    title,
    content,
    related_entity_id: relatedEntityId || null,
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString(),
  });
}

// Quality tier: good/medium/low, based on rating
function qualityTierOf(rating) {
  if (rating >= 4.8) return 'good';
  if (rating >= 4.5) return 'medium';
  return 'low';
}

// Price tier: low/medium/high, based on base_price
function priceTierOf(price) {
  if (price < 130) return 'low';
  if (price <= 250) return 'medium';
  return 'high';
}

function withTiers(service) {
  return {
    ...service,
    quality_tier: qualityTierOf(service.rating),
    price_tier: priceTierOf(service.base_price),
  };
}

function searchAndFilterServices(query) {
  let results = mockData.services
    .filter(s => s.is_active !== false)
    .map(enrichWithProvider)
    .map(withTiers);

  // Full-text search across name & description
  if (query.q) {
    const q = String(query.q).toLowerCase().trim();
    results = results.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.provider && s.provider.business_name.toLowerCase().includes(q))
    );
  }

  if (query.category) {
    results = results.filter(s => s.category === query.category);
  }
  if (query.minPrice) {
    results = results.filter(s => s.base_price >= parseFloat(query.minPrice));
  }
  if (query.maxPrice) {
    results = results.filter(s => s.base_price <= parseFloat(query.maxPrice));
  }
  if (query.minRating) {
    results = results.filter(s => s.rating >= parseFloat(query.minRating));
  }
  if (query.qualityTier) {
    results = results.filter(s => s.quality_tier === query.qualityTier);
  }
  if (query.priceTier) {
    results = results.filter(s => s.price_tier === query.priceTier);
  }

  // Distance-based filtering (nearest search)
  const hasLocation = query.latitude && query.longitude;
  if (hasLocation) {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);
    const radiusKm = query.radiusKm ? parseFloat(query.radiusKm) : 10;

    results = results
      .map(s => ({
        ...s,
        distance_km: s.provider
          ? Number(distanceKm(lat, lng, s.provider.latitude, s.provider.longitude).toFixed(2))
          : null,
      }))
      .filter(s => s.distance_km !== null && s.distance_km <= radiusKm);
  }

  // Sorting
  const sortBy = query.sortBy || 'newest';
  switch (sortBy) {
    case 'rating':
    case 'best':
      results.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
      break;
    case 'price-low':
      results.sort((a, b) => a.base_price - b.base_price);
      break;
    case 'price-high':
      results.sort((a, b) => b.base_price - a.base_price);
      break;
    case 'reviews':
      results.sort((a, b) => b.review_count - a.review_count);
      break;
    case 'nearest':
      if (hasLocation) {
        results.sort((a, b) => a.distance_km - b.distance_km);
      }
      break;
    case 'newest':
    default:
      results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }

  // Pagination
  const limit = query.limit ? parseInt(query.limit) : 20;
  const offset = query.offset ? parseInt(query.offset) : 0;
  const total = results.length;
  const paged = results.slice(offset, offset + limit);

  return { data: paged, total, limit, offset };
}

// API Routes
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'ServiceHub Demo API',
      health: '/health',
      services: '/api/v1/services',
      categories: '/api/v1/services/categories',
      dashboard: '/api/v1/admin/dashboard',
    }));
    return;
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
    return;
  }

  // Auth endpoints
  if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (mockData.users.some(u => u.email === data.email)) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: 'An account with this email already exists' }));
        return;
      }
      const newUser = {
        id: crypto.randomUUID(),
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        user_type: 'customer',
        verified_email: false,
      };
      mockData.users.push(newUser);
      const devVerifyLink = issueVerificationLink(newUser);
      res.writeHead(201);
      res.end(JSON.stringify({
        message: 'User registered successfully',
        user: sanitizeUser(newUser),
        access_token: generateToken(newUser.id),
        dev_verify_link: devVerifyLink,
      }));
    });
    return;
  }

  // Verify email via token from the registration/resend link
  if (pathname === '/api/v1/auth/verify-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const entry = verifyEmailTokens.get(data.token);
      if (!entry || entry.expires < Date.now()) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid or expired verification link' }));
        return;
      }
      const user = mockData.users.find(u => u.id === entry.userId);
      if (!user) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      user.verified_email = true;
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Email verified successfully' }));
    });
    return;
  }

  // Resend the verification email — same generic-response shape as
  // forgot-password so it never reveals whether the account exists.
  if (pathname === '/api/v1/auth/resend-verification' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const user = mockData.users.find(u => u.email === data.email);
      const responseBody = {
        message: 'If an account exists for that email and is not yet verified, a verification link has been sent.',
      };
      if (user && !user.verified_email) {
        responseBody.dev_verify_link = issueVerificationLink(user);
      }
      res.writeHead(200);
      res.end(JSON.stringify(responseBody));
    });
    return;
  }

  // Refresh: opaque demo tokens don't distinguish access/refresh, so this
  // just re-issues a fresh token for the same user and revokes the old one.
  if (pathname === '/api/v1/auth/refresh-token' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Refresh token not found' }));
      return;
    }
    tokens.delete(token);
    res.writeHead(200);
    res.end(JSON.stringify({ access_token: generateToken(userId) }));
    return;
  }

  if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) tokens.delete(token);
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Logout successful' }));
    return;
  }

  // Apply to become a provider
  if (pathname === '/api/v1/providers/apply' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    if (mockData.providers.some(p => p.user_id === userId)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'User is already a provider' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.business_name) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Business name is required' }));
        return;
      }

      const newProvider = {
        id: crypto.randomUUID(),
        user_id: userId,
        business_name: data.business_name,
        business_description: data.business_description || '',
        average_rating: 0,
        total_reviews: 0,
        total_bookings: 0,
        verification_status: 'pending',
        service_categories: data.service_categories || [],
        latitude: 40.7484,
        longitude: -73.9857,
      };
      mockData.providers.push(newProvider);

      // Grant provider-only access immediately (mirrors the real backend);
      // existing tokens still read the old user_type until the user logs in
      // again or the app refreshes /auth/me.
      const user = mockData.users.find(u => u.id === userId);
      if (user) user.user_type = 'provider';

      res.writeHead(201);
      res.end(JSON.stringify({
        message: 'Provider application submitted successfully. Log in again to access provider features.',
        data: newProvider,
      }));
    });
    return;
  }

  // Provider's own profile (their provider row + user contact fields)
  if (pathname === '/api/v1/providers/profile' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Provider profile not found' }));
      return;
    }
    const user = mockData.users.find(u => u.id === userId);
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Provider profile retrieved',
      data: {
        ...provider,
        email: user?.email,
        first_name: user?.first_name,
        last_name: user?.last_name,
        phone: user?.phone,
        avatar_url: user?.avatar_url,
      },
    }));
    return;
  }

  // Update business_name / business_description / service_categories / response_time_minutes
  if (pathname === '/api/v1/providers/settings' && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Provider not found' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      ['business_name', 'business_description', 'service_categories', 'response_time_minutes'].forEach((field) => {
        if (data[field] !== undefined) provider[field] = data[field];
      });
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Provider settings updated', data: provider }));
    });
    return;
  }

  // Update the provider's weekly availability schedule
  if (pathname === '/api/v1/providers/availability' && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Provider not found' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.availability) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Availability schedule is required' }));
        return;
      }
      provider.availability = data.availability;
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Availability updated', data: provider }));
    });
    return;
  }

  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const user = mockData.users.find(u => u.email === data.email);
      if (user && user.password === data.password) {
        res.writeHead(200);
        res.end(JSON.stringify({
          message: 'Login successful',
          user: sanitizeUser(user),
          access_token: generateToken(user.id),
        }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid email or password' }));
      }
    });
    return;
  }

  // Requests a password reset. Always returns a generic message so the
  // response never reveals whether the email is registered; the actual
  // reset link is only included here because this is a demo server with
  // no real email delivery (mirrors dev-mode behavior of the real backend).
  if (pathname === '/api/v1/auth/forgot-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const user = mockData.users.find(u => u.email === data.email);
      const responseBody = { message: 'If an account exists for that email, a reset link has been sent.' };
      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        resetTokens.set(resetToken, { userId: user.id, expires: Date.now() + 30 * 60000 });
        responseBody.dev_reset_link = `http://localhost:3000/reset-password?token=${resetToken}`;
      }
      res.writeHead(200);
      res.end(JSON.stringify(responseBody));
    });
    return;
  }

  // Consumes a reset token: opaque, single-use (deleted from the map on
  // success), and time-limited — no iat/timestamp trickery needed since,
  // unlike the real backend's stateless JWTs, this demo server can just
  // track token state in memory.
  if (pathname === '/api/v1/auth/reset-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const entry = resetTokens.get(data.token);
      if (!entry || entry.expires < Date.now()) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid or expired reset link' }));
        return;
      }
      if (!data.password || data.password.length < 8) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Password must be at least 8 characters' }));
        return;
      }
      const user = mockData.users.find(u => u.id === entry.userId);
      if (!user) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      user.password = data.password;
      resetTokens.delete(data.token);
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Password reset successfully' }));
    });
    return;
  }

  if (pathname === '/api/v1/auth/me' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    const user = mockData.users.find(u => u.id === userId);
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ user: sanitizeUser(user) }));
    return;
  }

  // Update own profile
  if (pathname === '/api/v1/auth/me' && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    const user = mockData.users.find(u => u.id === userId);
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      ['first_name', 'last_name', 'phone', 'bio', 'avatar_url'].forEach((field) => {
        if (data[field] !== undefined) user[field] = data[field];
      });

      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Profile updated', user: sanitizeUser(user) }));
    });
    return;
  }

  // Save this user's Expo push token
  if (pathname === '/api/v1/auth/push-token' && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    const user = mockData.users.find(u => u.id === userId);
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.push_token) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'push_token is required' }));
        return;
      }
      user.push_token = data.push_token;
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Push token saved' }));
    });
    return;
  }

  // Nearby services (distance-based search)
  if (pathname === '/api/v1/services/nearby' && req.method === 'GET') {
    if (!query.latitude || !query.longitude) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'latitude and longitude are required' }));
      return;
    }
    const result = searchAndFilterServices({ ...query, sortBy: query.sortBy || 'nearest' });
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Nearby services retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: Math.ceil(result.total / result.limit),
      },
    }));
    return;
  }

  // Create a service (provider only)
  if (pathname === '/api/v1/services' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'User is not a provider' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.name || !data.category || data.base_price == null) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'name, category, and base_price are required' }));
        return;
      }

      const newService = {
        id: crypto.randomUUID(),
        provider_id: provider.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        subcategory: data.subcategory || null,
        base_price: data.base_price,
        price_unit: data.price_unit || 'flat_rate',
        duration_minutes: data.duration_minutes || null,
        rating: 0,
        review_count: 0,
        images: data.images || [],
        is_active: true,
        created_at: new Date().toISOString(),
      };
      mockData.services.push(newService);

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Service created successfully', data: withTiers(enrichWithProvider(newService)) }));
    });
    return;
  }

  // Update / deactivate a service (owning provider only)
  const serviceIdMatch = pathname.match(/^\/api\/v1\/services\/([^/]+)$/);
  if (serviceIdMatch && (req.method === 'PUT' || req.method === 'DELETE') && !['categories', 'featured', 'nearby'].includes(serviceIdMatch[1])) {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const service = mockData.services.find(s => s.id === serviceIdMatch[1]);
    if (!service) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Service not found' }));
      return;
    }
    const provider = mockData.providers.find(p => p.id === service.provider_id);
    if (!provider || provider.user_id !== userId) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Not authorized to modify this service' }));
      return;
    }

    if (req.method === 'DELETE') {
      service.is_active = false;
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Service deleted successfully' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      ['name', 'description', 'category', 'base_price', 'price_unit', 'duration_minutes', 'images', 'is_active'].forEach((field) => {
        if (data[field] !== undefined) service[field] = data[field];
      });
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Service updated successfully', data: withTiers(enrichWithProvider(service)) }));
    });
    return;
  }

  // List a provider's own services (any status), for their management screen
  if (pathname === '/api/v1/services/mine' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'User is not a provider' }));
      return;
    }

    const mine = mockData.services
      .filter(s => s.provider_id === provider.id)
      .map(withTiers);

    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Your services retrieved successfully', data: mine }));
    return;
  }

  // Services endpoints (search, filter, sort, paginate)
  if (pathname === '/api/v1/services' && req.method === 'GET') {
    const result = searchAndFilterServices(query);

    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Services retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: Math.ceil(result.total / result.limit),
      },
    }));
    return;
  }

  // Get service by ID
  if (pathname.match(/^\/api\/v1\/services\/[a-f0-9-]+$/) && req.method === 'GET') {
    const serviceId = pathname.split('/').pop();
    const service = mockData.services.find(s => s.id === serviceId && s.is_active !== false);
    if (service) {
      const enriched = withTiers(enrichWithProvider(service));
      const providerUserId = enriched.provider ? enriched.provider.user_id : null;
      const recentReviews = mockData.reviews
        .filter(r => r.reviewee_id === providerUserId)
        .map(r => {
          const reviewer = mockData.users.find(u => u.id === r.reviewer_id);
          return {
            ...r,
            first_name: reviewer ? reviewer.first_name : undefined,
            last_name: reviewer ? reviewer.last_name : undefined,
          };
        });
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Service retrieved successfully',
        data: { ...enriched, recent_reviews: recentReviews },
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Service not found' }));
    }
    return;
  }

  // Categories
  if (pathname === '/api/v1/services/categories' && req.method === 'GET') {
    const categories = [...new Set(mockData.services.map(s => s.category))];
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Categories retrieved successfully',
      data: categories,
    }));
    return;
  }

  // List bookings — includes both bookings the user made (as customer) and
  // bookings for services they provide (as provider)
  if (pathname === '/api/v1/bookings' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const visible = mockData.bookings
      .filter(b => isBookingParticipant(b, userId))
      .map(b => enrichBooking(b, userId))
      .sort((a, c) => new Date(c.created_at) - new Date(a.created_at));

    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Bookings retrieved', data: visible }));
    return;
  }

  // Create a booking
  if (pathname === '/api/v1/bookings' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const service = mockData.services.find(s => s.id === data.service_id);
      if (!service) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Service not found' }));
        return;
      }

      const newBooking = {
        id: crypto.randomUUID(),
        user_id: userId,
        provider_id: service.provider_id,
        service_id: data.service_id,
        status: 'requested',
        scheduled_date: data.scheduled_date,
        scheduled_duration_minutes: data.scheduled_duration_minutes || null,
        service_address: data.service_address,
        notes: data.notes || null,
        requested_at: new Date().toISOString(),
        accepted_at: null,
        completed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
        cancelled_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockData.bookings.push(newBooking);

      const provider = mockData.providers.find(p => p.id === service.provider_id);
      if (provider) {
        createNotification(
          provider.user_id,
          'booking_requested',
          'New booking request',
          `You have a new request for ${service.name}`,
          newBooking.id
        );
      }

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Booking created', data: enrichBooking(newBooking, userId) }));
    });
    return;
  }

  // Get / act on a single booking
  const bookingActionMatch = pathname.match(/^\/api\/v1\/bookings\/([^/]+)(?:\/(accept|reject|complete|cancel))?$/);
  if (bookingActionMatch && (req.method === 'GET' || req.method === 'PUT')) {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const [, bookingId, action] = bookingActionMatch;
    const booking = mockData.bookings.find(b => b.id === bookingId);
    if (!booking) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Booking not found' }));
      return;
    }

    if (!isBookingParticipant(booking, userId)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Not a participant in this booking' }));
      return;
    }

    const provider = mockData.providers.find(p => p.id === booking.provider_id);
    const isProvider = !!provider && provider.user_id === userId;
    const isCustomer = booking.user_id === userId;

    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ data: enrichBooking(booking, userId) }));
      return;
    }

    // PUT actions
    if (action === 'accept' || action === 'reject') {
      if (!isProvider) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Only the provider can respond to this booking' }));
        return;
      }
      booking.status = action === 'accept' ? 'accepted' : 'rejected';
      booking.updated_at = new Date().toISOString();
      if (action === 'accept') booking.accepted_at = booking.updated_at;
      else {
        booking.cancelled_at = booking.updated_at;
        booking.cancelled_by = 'provider';
      }
      const actedService = mockData.services.find(s => s.id === booking.service_id);
      createNotification(
        booking.user_id,
        action === 'accept' ? 'booking_accepted' : 'booking_rejected',
        action === 'accept' ? 'Booking accepted' : 'Booking declined',
        `Your request for ${actedService ? actedService.name : 'a service'} was ${action === 'accept' ? 'accepted' : 'declined'}`,
        booking.id
      );
      res.writeHead(200);
      res.end(JSON.stringify({ message: `Booking ${booking.status}`, data: enrichBooking(booking, userId) }));
      return;
    }

    if (action === 'complete') {
      booking.status = 'completed';
      booking.completed_at = new Date().toISOString();
      booking.updated_at = booking.completed_at;
      const completedService = mockData.services.find(s => s.id === booking.service_id);
      const notifyUserId = isCustomer ? provider?.user_id : booking.user_id;
      if (notifyUserId) {
        createNotification(
          notifyUserId,
          'booking_completed',
          'Booking completed',
          `${completedService ? completedService.name : 'The service'} has been marked completed`,
          booking.id
        );
      }
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Booking completed', data: enrichBooking(booking, userId) }));
      return;
    }

    if (action === 'cancel') {
      if (!isCustomer) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Only the customer can cancel this booking' }));
        return;
      }
      booking.status = 'cancelled';
      booking.cancelled_at = new Date().toISOString();
      booking.cancelled_by = 'user';
      booking.updated_at = booking.cancelled_at;
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Booking cancelled', data: enrichBooking(booking, userId) }));
      return;
    }

    // PUT with no recognized action segment
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
    return;
  }

  // Submit a review for a completed booking
  if (pathname === '/api/v1/reviews' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.booking_id || !data.rating) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'booking_id and rating are required' }));
        return;
      }

      const booking = mockData.bookings.find(
        b => b.id === data.booking_id && b.user_id === userId && b.status === 'completed'
      );
      if (!booking) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid or incomplete booking' }));
        return;
      }
      if (mockData.reviews.some(r => r.booking_id === data.booking_id)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'A review already exists for this booking' }));
        return;
      }

      const provider = mockData.providers.find(p => p.id === booking.provider_id);
      const revieweeId = provider ? provider.user_id : null;

      const review = {
        id: crypto.randomUUID(),
        booking_id: data.booking_id,
        reviewer_id: userId,
        reviewee_id: revieweeId,
        rating: data.rating,
        title: data.title || null,
        content: data.content || null,
        cleanliness_rating: data.cleanliness_rating || null,
        professionalism_rating: data.professionalism_rating || null,
        punctuality_rating: data.punctuality_rating || null,
        value_rating: data.value_rating || null,
        helpful_count: 0,
        created_at: new Date().toISOString(),
      };
      mockData.reviews.push(review);

      // Recompute the provider's aggregate rating from all their reviews
      if (provider) {
        const theirReviews = mockData.reviews.filter(r => r.reviewee_id === revieweeId);
        provider.average_rating = Number(
          (theirReviews.reduce((sum, r) => sum + r.rating, 0) / theirReviews.length).toFixed(2)
        );
        provider.total_reviews = theirReviews.length;

        createNotification(
          revieweeId,
          'review_posted',
          'New review',
          review.title ? `"${review.title}" — ${review.rating}★` : `You received a ${review.rating}★ review`,
          review.id
        );
      }

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Review submitted', data: review }));
    });
    return;
  }

  // Reviews endpoint
  if (pathname === '/api/v1/reviews' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Reviews retrieved',
      data: mockData.reviews,
    }));
    return;
  }

  // Toggle helpful vote on a review
  const helpfulMatch = pathname.match(/^\/api\/v1\/reviews\/([^/]+)\/helpful$/);
  if (helpfulMatch && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const reviewId = helpfulMatch[1];
    const review = mockData.reviews.find(r => r.id === reviewId);
    if (!review) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Review not found' }));
      return;
    }

    if (!reviewHelpfulVotes.has(reviewId)) reviewHelpfulVotes.set(reviewId, new Set());
    const voters = reviewHelpfulVotes.get(reviewId);

    let voted;
    if (voters.has(userId)) {
      voters.delete(userId);
      review.helpful_count = Math.max(0, review.helpful_count - 1);
      voted = false;
    } else {
      voters.add(userId);
      review.helpful_count += 1;
      voted = true;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      message: voted ? 'Marked as helpful' : 'Helpful vote removed',
      data: { review_id: reviewId, helpful_count: review.helpful_count, voted },
    }));
    return;
  }

  // List reviews for a specific provider (checked before the single-review
  // GET below since this path has an extra segment)
  const providerReviewsMatch = pathname.match(/^\/api\/v1\/reviews\/provider\/([^/]+)$/);
  if (providerReviewsMatch && req.method === 'GET') {
    const providerId = providerReviewsMatch[1];
    const provider = mockData.providers.find(p => p.id === providerId);
    const reviews = provider
      ? mockData.reviews
          .filter(r => r.reviewee_id === provider.user_id)
          .map(r => {
            const reviewer = mockData.users.find(u => u.id === r.reviewer_id);
            return {
              ...r,
              first_name: reviewer ? reviewer.first_name : undefined,
              last_name: reviewer ? reviewer.last_name : undefined,
              avatar_url: reviewer ? reviewer.avatar_url : undefined,
            };
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : [];
    res.writeHead(200);
    res.end(JSON.stringify({ data: reviews }));
    return;
  }

  // Single review, update, delete (owner-only for mutations)
  const reviewIdMatch = pathname.match(/^\/api\/v1\/reviews\/([^/]+)$/);
  if (reviewIdMatch && ['GET', 'PUT', 'DELETE'].includes(req.method)) {
    const reviewId = reviewIdMatch[1];

    if (req.method === 'GET') {
      const review = mockData.reviews.find(r => r.id === reviewId);
      if (!review) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Review not found' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ data: review }));
      return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    if (req.method === 'DELETE') {
      const index = mockData.reviews.findIndex(r => r.id === reviewId && r.reviewer_id === userId);
      if (index === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Review not found' }));
        return;
      }
      mockData.reviews.splice(index, 1);
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Review deleted' }));
      return;
    }

    // PUT
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const review = mockData.reviews.find(r => r.id === reviewId && r.reviewer_id === userId);
      if (!review) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Review not found' }));
        return;
      }
      if (data.rating !== undefined) review.rating = data.rating;
      if (data.content !== undefined) review.content = data.content;
      review.updated_at = new Date().toISOString();

      // Recompute the provider's aggregate rating since this review's rating may have changed
      const provider = mockData.providers.find(p => p.user_id === review.reviewee_id);
      if (provider) {
        const theirReviews = mockData.reviews.filter(r => r.reviewee_id === review.reviewee_id);
        provider.average_rating = Number(
          (theirReviews.reduce((sum, r) => sum + r.rating, 0) / theirReviews.length).toFixed(2)
        );
      }

      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Review updated', data: review }));
    });
    return;
  }

  // Messages endpoint — no real-backend equivalent exists (it has no bare
  // GET /messages route), so this previously returned every user's messages
  // unauthenticated. Scoped to the caller's own messages to close that leak.
  if (pathname === '/api/v1/messages' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const mine = mockData.messages.filter(m => m.sender_id === userId || m.receiver_id === userId);
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Messages retrieved',
      data: mine,
    }));
    return;
  }

  // Conversations: one row per booking the current user participates in
  if (pathname === '/api/v1/messages/conversations' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const myProviderIds = mockData.providers.filter(p => p.user_id === userId).map(p => p.id);

    const conversations = mockData.bookings
      .filter(b => b.user_id === userId || myProviderIds.includes(b.provider_id))
      .map(b => {
        const service = mockData.services.find(s => s.id === b.service_id);
        const provider = mockData.providers.find(p => p.id === b.provider_id);
        const isCustomerView = b.user_id === userId;
        const otherUserId = isCustomerView ? (provider ? provider.user_id : null) : b.user_id;
        const otherUser = mockData.users.find(u => u.id === otherUserId);
        const otherUserName = isCustomerView
          ? (provider ? provider.business_name : 'Provider')
          : (otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Customer');

        const bookingMessages = mockData.messages
          .filter(m => m.booking_id === b.id)
          .sort((a, c) => new Date(c.created_at) - new Date(a.created_at));
        const lastMessage = bookingMessages[0];

        return {
          ...b,
          name: service ? service.name : undefined,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: lastMessage ? lastMessage.content : null,
          last_message_time: lastMessage ? lastMessage.created_at : null,
        };
      })
      .sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      });

    res.writeHead(200);
    res.end(JSON.stringify({ data: conversations }));
    return;
  }

  // Send a message
  if (pathname === '/api/v1/messages' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const booking = mockData.bookings.find(b => b.id === data.booking_id);
      if (!booking) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Booking not found' }));
        return;
      }

      const provider = mockData.providers.find(p => p.id === booking.provider_id);
      const isParticipant = booking.user_id === userId || (provider && provider.user_id === userId);
      if (!isParticipant) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Not a participant in this booking' }));
        return;
      }

      const newMessage = {
        id: crypto.randomUUID(),
        booking_id: data.booking_id,
        sender_id: userId,
        receiver_id: data.receiver_id,
        content: data.content,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      mockData.messages.push(newMessage);

      createNotification(
        data.receiver_id,
        'message_received',
        'New message',
        data.content.length > 80 ? `${data.content.slice(0, 80)}…` : data.content,
        data.booking_id
      );

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Message sent', data: newMessage }));
    });
    return;
  }

  // Thread of messages for a specific booking
  const bookingThreadMatch = pathname.match(/^\/api\/v1\/messages\/([^/]+)$/);
  if (bookingThreadMatch && req.method === 'GET' && bookingThreadMatch[1] !== 'conversations') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const bookingId = bookingThreadMatch[1];
    const booking = mockData.bookings.find(b => b.id === bookingId);
    if (!booking) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Booking not found' }));
      return;
    }

    const provider = mockData.providers.find(p => p.id === booking.provider_id);
    const isParticipant = booking.user_id === userId || (provider && provider.user_id === userId);
    if (!isParticipant) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Not a participant in this booking' }));
      return;
    }

    const thread = mockData.messages
      .filter(m => m.booking_id === bookingId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(m => {
        const sender = mockData.users.find(u => u.id === m.sender_id);
        return {
          ...m,
          first_name: sender ? sender.first_name : undefined,
          last_name: sender ? sender.last_name : undefined,
        };
      });

    res.writeHead(200);
    res.end(JSON.stringify({ data: thread }));
    return;
  }

  // Mark a message read — only the receiver can do this (mirrors the
  // backend fix: without a receiver check, any user could flip any
  // other user's message to read given just its id).
  const messageReadMatch = pathname.match(/^\/api\/v1\/messages\/([^/]+)\/read$/);
  if (messageReadMatch && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const message = mockData.messages.find(m => m.id === messageReadMatch[1] && m.receiver_id === userId);
    if (!message) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Message not found' }));
      return;
    }
    message.is_read = true;
    message.read_at = new Date().toISOString();
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Message marked as read', data: message }));
    return;
  }

  // Delete a message — only the sender can do this
  const messageDeleteMatch = pathname.match(/^\/api\/v1\/messages\/([^/]+)$/);
  if (messageDeleteMatch && req.method === 'DELETE') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const index = mockData.messages.findIndex(m => m.id === messageDeleteMatch[1] && m.sender_id === userId);
    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Message not found' }));
      return;
    }
    mockData.messages.splice(index, 1);
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Message deleted' }));
    return;
  }

  // Provider payout history and total earnings
  if (pathname === '/api/v1/payments/provider/payouts' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const provider = mockData.providers.find(p => p.user_id === userId);
    if (!provider) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'User is not a provider' }));
      return;
    }

    const payouts = mockData.payments
      .filter(p => p.provider_id === provider.id && p.status === 'completed')
      .map(p => {
        const booking = mockData.bookings.find(b => b.id === p.booking_id);
        const service = booking ? mockData.services.find(s => s.id === booking.service_id) : null;
        return { ...p, name: service ? service.name : undefined };
      })
      .sort((a, b) => new Date(b.processed_at || b.created_at) - new Date(a.processed_at || a.created_at));

    const totalEarnings = payouts.reduce((sum, p) => sum + (p.provider_payout_amount ?? p.amount * 0.85), 0);

    res.writeHead(200);
    res.end(JSON.stringify({ data: payouts, total_earnings: totalEarnings }));
    return;
  }

  // List the current user's own payments (as the paying customer) — mirrors
  // the real backend's listUserPayments. This previously returned every
  // user's payment records unauthenticated; scoped + paginated to match.
  if (pathname === '/api/v1/payments' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;
    const mine = mockData.payments
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit)
      .map(p => {
        const booking = mockData.bookings.find(b => b.id === p.booking_id);
        const service = booking ? mockData.services.find(s => s.id === booking.service_id) : null;
        return { ...p, name: service ? service.name : undefined };
      });
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Payments retrieved',
      data: mine,
    }));
    return;
  }

  // Create a payment intent for an accepted booking
  if (pathname === '/api/v1/payments/intent' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const booking = mockData.bookings.find(b => b.id === data.booking_id && b.user_id === userId);
      if (!booking) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Booking not found' }));
        return;
      }
      if (booking.status !== 'accepted') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Booking must be accepted by the provider before payment' }));
        return;
      }
      if (mockData.payments.some(p => p.booking_id === data.booking_id)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'A payment already exists for this booking' }));
        return;
      }

      // A promo discounts what's actually charged; commission (and so the
      // provider's payout) is computed on the discounted amount, mirroring
      // the real backend — the promo's cost is shared, not absorbed by one side.
      let discountAmount = 0;
      let promoId = null;
      if (data.promo_code) {
        try {
          const { promo, discount } = computeDiscount(data.promo_code, userId, data.amount);
          discountAmount = discount;
          promoId = promo.id;
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }
      const chargedAmount = Number((data.amount - discountAmount).toFixed(2));
      const feeAmount = Number((chargedAmount * 0.15).toFixed(2));
      const providerAmount = Number((chargedAmount - feeAmount).toFixed(2));

      const payment = {
        id: crypto.randomUUID(),
        booking_id: data.booking_id,
        user_id: userId,
        provider_id: booking.provider_id,
        amount: chargedAmount,
        status: 'pending',
        fee_amount: feeAmount,
        provider_payout_amount: providerAmount,
        promo_code_id: promoId,
        discount_amount: discountAmount,
        created_at: new Date().toISOString(),
      };
      mockData.payments.push(payment);

      if (promoId) {
        mockData.promoRedemptions.push({
          id: crypto.randomUUID(),
          promo_code_id: promoId,
          user_id: userId,
          payment_id: payment.id,
          discount_amount: discountAmount,
        });
        const promo = mockData.promoCodes.find(p => p.id === promoId);
        if (promo) promo.redemption_count += 1;
      }

      res.writeHead(201);
      res.end(JSON.stringify({
        message: 'Payment intent created',
        data: { ...payment, client_secret: `pi_${crypto.randomUUID()}` },
      }));
    });
    return;
  }

  // Preview a promo code's discount without redeeming it
  if (pathname === '/api/v1/promos/validate' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.code || data.booking_amount == null) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'code and booking_amount are required' }));
        return;
      }
      try {
        const { discount } = computeDiscount(data.code, userId, parseFloat(data.booking_amount));
        res.writeHead(200);
        res.end(JSON.stringify({
          data: {
            discount_amount: discount,
            final_amount: Number((parseFloat(data.booking_amount) - discount).toFixed(2)),
          },
        }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Confirm a payment — moves the booking to in_progress
  if (pathname === '/api/v1/payments/confirm' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const payment = mockData.payments.find(p => p.id === data.payment_id && p.user_id === userId);
      if (!payment) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Payment not found' }));
        return;
      }

      payment.status = 'completed';
      payment.stripe_charge_id = data.stripe_charge_id;
      payment.processed_at = new Date().toISOString();

      const booking = mockData.bookings.find(b => b.id === payment.booking_id);
      if (booking) {
        booking.status = 'in_progress';
        booking.updated_at = new Date().toISOString();
      }

      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Payment confirmed', data: payment }));
    });
    return;
  }

  // Get a single payment (owner or the provider on it only)
  const paymentMatch = pathname.match(/^\/api\/v1\/payments\/([^/]+)$/);
  if (paymentMatch && req.method === 'GET' && paymentMatch[1] !== 'intent' && paymentMatch[1] !== 'confirm') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const payment = mockData.payments.find(p => p.id === paymentMatch[1]);
    if (!payment) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Payment not found' }));
      return;
    }
    const provider = mockData.providers.find(p => p.id === payment.provider_id);
    const isOwner = payment.user_id === userId || (provider && provider.user_id === userId);
    if (!isOwner) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Payment not found' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ data: payment }));
    return;
  }

  // Refund a completed payment (payer only)
  const refundMatch = pathname.match(/^\/api\/v1\/payments\/([^/]+)\/refund$/);
  if (refundMatch && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const payment = mockData.payments.find(
      p => p.id === refundMatch[1] && p.user_id === userId && p.status === 'completed'
    );
    if (!payment) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Payment not found' }));
      return;
    }
    payment.status = 'refunded';
    payment.refunded_at = new Date().toISOString();
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Refund processed', data: payment }));
    return;
  }

  // File a dispute on a booking
  if (pathname === '/api/v1/disputes' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.booking_id || !data.title || !data.description) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'booking_id, title, and description are required' }));
        return;
      }

      const booking = mockData.bookings.find(b => b.id === data.booking_id);
      if (!booking) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Booking not found' }));
        return;
      }
      if (!isBookingParticipant(booking, userId)) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Not a participant in this booking' }));
        return;
      }
      if (mockData.disputes.some(d => d.booking_id === data.booking_id && ['open', 'under_review'].includes(d.status))) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'An open dispute already exists for this booking' }));
        return;
      }

      const dispute = {
        id: crypto.randomUUID(),
        booking_id: data.booking_id,
        initiated_by: userId,
        status: 'open',
        title: data.title,
        description: data.description,
        evidence_urls: data.evidence_urls || [],
        resolution: null,
        refund_amount: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      mockData.disputes.push(dispute);

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Dispute filed', data: dispute }));
    });
    return;
  }

  // List disputes the current user is involved in
  if (pathname === '/api/v1/disputes' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const mine = mockData.disputes.filter(d => {
      const booking = mockData.bookings.find(b => b.id === d.booking_id);
      return d.initiated_by === userId || (booking && isBookingParticipant(booking, userId));
    });

    res.writeHead(200);
    res.end(JSON.stringify({ data: mine }));
    return;
  }

  // Get a single dispute (participants only)
  const disputeIdMatch = pathname.match(/^\/api\/v1\/disputes\/([^/]+)$/);
  if (disputeIdMatch && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const dispute = mockData.disputes.find(d => d.id === disputeIdMatch[1]);
    if (!dispute) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Dispute not found' }));
      return;
    }
    const booking = mockData.bookings.find(b => b.id === dispute.booking_id);
    if (dispute.initiated_by !== userId && !(booking && isBookingParticipant(booking, userId))) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Not authorized to view this dispute' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({ data: dispute }));
    return;
  }

  // List my notifications
  if (pathname === '/api/v1/notifications' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const mine = mockData.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const unreadCount = mine.filter(n => !n.is_read).length;

    res.writeHead(200);
    res.end(JSON.stringify({ data: mine, unread_count: unreadCount }));
    return;
  }

  // Mark all notifications as read
  if (pathname === '/api/v1/notifications/read-all' && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    mockData.notifications
      .filter(n => n.user_id === userId && !n.is_read)
      .forEach(n => {
        n.is_read = true;
        n.read_at = new Date().toISOString();
      });

    res.writeHead(200);
    res.end(JSON.stringify({ message: 'All notifications marked as read' }));
    return;
  }

  // Mark a single notification as read
  const notifIdMatch = pathname.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/);
  if (notifIdMatch && req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }

    const notif = mockData.notifications.find(n => n.id === notifIdMatch[1] && n.user_id === userId);
    if (!notif) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Notification not found' }));
      return;
    }
    notif.is_read = true;
    notif.read_at = new Date().toISOString();

    res.writeHead(200);
    res.end(JSON.stringify({ data: notif }));
    return;
  }

  // List the current user's saved providers
  if (pathname === '/api/v1/favorites' && req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const mine = mockData.favorites
      .filter(f => f.user_id === userId)
      .map(f => {
        const provider = mockData.providers.find(p => p.id === f.provider_id);
        const user = provider ? mockData.users.find(u => u.id === provider.user_id) : null;
        return {
          favorite_id: f.id,
          favorited_at: f.created_at,
          provider_id: f.provider_id,
          business_name: provider?.business_name,
          average_rating: provider?.average_rating,
          total_reviews: provider?.total_reviews,
          verification_status: provider?.verification_status,
          first_name: user?.first_name,
          last_name: user?.last_name,
        };
      })
      .sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at));
    res.writeHead(200);
    res.end(JSON.stringify({ data: mine }));
    return;
  }

  // Save a provider to favorites (idempotent)
  if (pathname === '/api/v1/favorites' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      if (!data.provider_id) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'provider_id is required' }));
        return;
      }
      const provider = mockData.providers.find(p => p.id === data.provider_id);
      if (!provider) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Provider not found' }));
        return;
      }
      const existing = mockData.favorites.find(f => f.user_id === userId && f.provider_id === data.provider_id);
      if (existing) {
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Already saved', data: existing }));
        return;
      }
      const favorite = {
        id: crypto.randomUUID(),
        user_id: userId,
        provider_id: data.provider_id,
        created_at: new Date().toISOString(),
      };
      mockData.favorites.push(favorite);
      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Provider saved', data: favorite }));
    });
    return;
  }

  // Remove a saved provider
  const favoriteDeleteMatch = pathname.match(/^\/api\/v1\/favorites\/([^/]+)$/);
  if (favoriteDeleteMatch && req.method === 'DELETE') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const index = mockData.favorites.findIndex(
      f => f.user_id === userId && f.provider_id === favoriteDeleteMatch[1]
    );
    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not in favorites' }));
      return;
    }
    mockData.favorites.splice(index, 1);
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Provider removed from favorites' }));
    return;
  }

  // Admin dashboard
  if (pathname === '/api/v1/admin/dashboard' && req.method === 'GET') {
    if (!requireAdmin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Dashboard retrieved',
      data: {
        total_customers: mockData.users.filter(u => u.user_type === 'customer').length,
        verified_providers: mockData.providers.filter(p => p.verification_status === 'verified').length,
        completed_bookings: mockData.bookings.filter(b => b.status === 'completed').length,
        total_revenue: mockData.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      },
    }));
    return;
  }

  // List providers pending verification
  if (pathname === '/api/v1/admin/providers/pending' && req.method === 'GET') {
    if (!requireAdmin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    const pending = mockData.providers
      .filter(p => p.verification_status === 'pending')
      .map(p => {
        const user = mockData.users.find(u => u.id === p.user_id);
        return { ...p, email: user?.email, first_name: user?.first_name, last_name: user?.last_name };
      });
    res.writeHead(200);
    res.end(JSON.stringify({ data: pending }));
    return;
  }

  // Verify / reject a provider application
  const adminProviderMatch = pathname.match(/^\/api\/v1\/admin\/providers\/([^/]+)\/(verify|reject)$/);
  if (adminProviderMatch && req.method === 'PUT') {
    if (!requireAdmin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    const [, providerId, action] = adminProviderMatch;
    const provider = mockData.providers.find(p => p.id === providerId);
    if (!provider) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Provider not found' }));
      return;
    }
    if (action === 'verify') {
      provider.verification_status = 'verified';
      provider.verified_at = new Date().toISOString();
    } else {
      provider.verification_status = 'rejected';
    }
    res.writeHead(200);
    res.end(JSON.stringify({ message: `Provider ${provider.verification_status}`, data: provider }));
    return;
  }

  // List open/under-review disputes
  if (pathname === '/api/v1/admin/disputes' && req.method === 'GET') {
    if (!requireAdmin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    const open = mockData.disputes
      .filter(d => ['open', 'under_review'].includes(d.status))
      .map(d => {
        const user = mockData.users.find(u => u.id === d.initiated_by);
        return { ...d, first_name: user?.first_name, last_name: user?.last_name };
      });
    res.writeHead(200);
    res.end(JSON.stringify({ data: open }));
    return;
  }

  // Resolve a dispute
  const adminDisputeMatch = pathname.match(/^\/api\/v1\/admin\/disputes\/([^/]+)\/resolve$/);
  if (adminDisputeMatch && req.method === 'PUT') {
    const admin = requireAdmin(req);
    if (!admin) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    const dispute = mockData.disputes.find(d => d.id === adminDisputeMatch[1]);
    if (!dispute) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Dispute not found' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      dispute.status = 'resolved';
      dispute.resolution = data.resolution || null;
      dispute.refund_amount = data.refund_amount ?? null;
      dispute.resolved_by_admin = admin.id;
      dispute.resolved_at = new Date().toISOString();
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Dispute resolved', data: dispute }));
    });
    return;
  }

  // Platform-wide analytics
  if (pathname === '/api/v1/admin/analytics' && req.method === 'GET') {
    if (!requireAdmin(req)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    const completedPayments = mockData.payments.filter(p => p.status === 'completed');
    const revenueByDay = {};
    completedPayments.forEach(p => {
      const day = (p.processed_at || p.created_at).slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + p.amount;
    });
    const bookingsByStatus = {};
    mockData.bookings.forEach(b => {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    });
    const avgRating = mockData.reviews.length
      ? mockData.reviews.reduce((sum, r) => sum + r.rating, 0) / mockData.reviews.length
      : 0;

    res.writeHead(200);
    res.end(JSON.stringify({
      data: {
        revenue_by_day: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
        bookings_by_status: Object.entries(bookingsByStatus).map(([status, count]) => ({ status, count })),
        review_stats: { avg_rating: Number(avgRating.toFixed(2)), total_reviews: mockData.reviews.length },
      },
    }));
    return;
  }

  // Upload/replace the current user's avatar
  if (pathname === '/api/v1/uploads/avatar' && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const { files } = parseMultipart(Buffer.concat(chunks), req.headers['content-type'] || '');
        const imageFile = files.find(f => f.fieldname === 'image') || files[0];
        if (!imageFile) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'No image file provided' }));
          return;
        }
        if (!Object.values(IMAGE_MIME_TYPES).includes(imageFile.contentType)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Only JPEG, PNG, WEBP, and GIF images are allowed' }));
          return;
        }
        const filename = saveUploadedFile(imageFile);
        const user = mockData.users.find(u => u.id === userId);
        user.avatar_url = `http://localhost:8080/uploads/${filename}`;
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Avatar updated', data: { avatar_url: user.avatar_url } }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Upload service images (owning provider only)
  const serviceUploadMatch = pathname.match(/^\/api\/v1\/uploads\/services\/([^/]+)$/);
  if (serviceUploadMatch && req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return;
    }
    const service = mockData.services.find(s => s.id === serviceUploadMatch[1]);
    const provider = service ? mockData.providers.find(p => p.id === service.provider_id) : null;
    if (!service || !provider || provider.user_id !== userId) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Service not found or not owned by you' }));
      return;
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const { files } = parseMultipart(Buffer.concat(chunks), req.headers['content-type'] || '');
        const imageFiles = files.filter(f => f.fieldname === 'images');
        if (!imageFiles.length) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'No image files provided' }));
          return;
        }
        for (const f of imageFiles) {
          if (!Object.values(IMAGE_MIME_TYPES).includes(f.contentType)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Only JPEG, PNG, WEBP, and GIF images are allowed' }));
            return;
          }
        }
        const newUrls = imageFiles.map(f => `http://localhost:8080/uploads/${saveUploadedFile(f)}`);
        service.images = [...(service.images || []), ...newUrls];
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Images uploaded', data: { images: service.images } }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve uploaded images
  const uploadFileMatch = pathname.match(/^\/uploads\/([^/]+)$/);
  if (uploadFileMatch && req.method === 'GET') {
    const filePath = path.join(UPLOAD_DIR, uploadFileMatch[1]);
    if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': IMAGE_MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Route not found' }));
}

// Create and start server
const PORT = Number(process.env.PORT) || 8080;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n✅ ServiceHub Demo Server Running!\n`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: curl http://localhost:${PORT}/health\n`);
  console.log(`📚 Try these endpoints:\n`);
  console.log(`1️⃣  Register:\n   curl -X POST http://localhost:${PORT}/api/v1/auth/register \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{\"email\":\"test@test.com\",\"password\":\"pass123\",\"first_name\":\"John\",\"last_name\":\"Doe\"}'\n`);
  console.log(`2️⃣  Login:\n   curl -X POST http://localhost:${PORT}/api/v1/auth/login \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{\"email\":\"john@test.com\",\"password\":\"pass123\"}'\n`);
  console.log(`3️⃣  List Services:\n   curl http://localhost:${PORT}/api/v1/services\n`);
  console.log(`4️⃣  Get Categories:\n   curl http://localhost:${PORT}/api/v1/services/categories\n`);
  console.log(`5️⃣  View Dashboard:\n   curl http://localhost:${PORT}/api/v1/admin/dashboard\n`);
  console.log(`\n✨ All 56 endpoints are ready!`);
});
