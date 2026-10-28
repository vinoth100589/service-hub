-- Seed test data for development

-- Insert test users (customers)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, user_type, verified_email, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'customer1@test.com', '$2a$12$abc123', 'John', 'Doe', '555-0001', 'customer', true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'customer2@test.com', '$2a$12$abc123', 'Jane', 'Smith', '555-0002', 'customer', true, true)
ON CONFLICT DO NOTHING;

-- Insert test provider users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, user_type, verified_email, is_active, location, address)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'plumber1@test.com', '$2a$12$abc123', 'Mike', 'Johnson', '555-0101', 'provider', true, true,
   ST_SetSRID(ST_Point(-73.9857, 40.7484), 4326), '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'),
  ('550e8400-e29b-41d4-a716-446655440102', 'electrician1@test.com', '$2a$12$abc123', 'Sarah', 'Williams', '555-0102', 'provider', true, true,
   ST_SetSRID(ST_Point(-73.9776, 40.7580), 4326), '{"street": "456 Oak Ave", "city": "New York", "state": "NY", "zip": "10002"}'),
  ('550e8400-e29b-41d4-a716-446655440103', 'cleaner1@test.com', '$2a$12$abc123', 'Maria', 'Garcia', '555-0103', 'provider', true, true,
   ST_SetSRID(ST_Point(-73.9654, 40.7505), 4326), '{"street": "789 Elm Dr", "city": "New York", "state": "NY", "zip": "10003"}')
ON CONFLICT DO NOTHING;

-- Insert providers
INSERT INTO providers (id, user_id, business_name, business_description, verification_status, verified_at,
                      average_rating, total_reviews, total_bookings, response_time_minutes, cancellation_rate,
                      service_categories, availability)
VALUES
  ('750e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440101', 'Mike''s Plumbing',
   'Professional plumbing services with 10+ years experience', 'verified', NOW(),
   4.8, 120, 250, 30, 0.02, '{"plumbing"}',
   '{"mon": {"start": "08:00", "end": "18:00"}, "tue": {"start": "08:00", "end": "18:00"}, "wed": {"start": "08:00", "end": "18:00"}, "thu": {"start": "08:00", "end": "18:00"}, "fri": {"start": "08:00", "end": "18:00"}, "sat": {"start": "10:00", "end": "16:00"}}'),

  ('750e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440102', 'Sarah''s Electric',
   'Licensed electrician, residential and commercial work', 'verified', NOW(),
   4.9, 95, 180, 25, 0.01, '{"electrical"}',
   '{"mon": {"start": "09:00", "end": "17:00"}, "tue": {"start": "09:00", "end": "17:00"}, "wed": {"start": "09:00", "end": "17:00"}, "thu": {"start": "09:00", "end": "17:00"}, "fri": {"start": "09:00", "end": "17:00"}, "sat": {"start": "10:00", "end": "14:00"}}'),

  ('750e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440103', 'Maria''s Cleaning Service',
   'Eco-friendly cleaning for homes and offices', 'verified', NOW(),
   4.7, 150, 320, 45, 0.03, '{"cleaning"}',
   '{"mon": {"start": "08:00", "end": "19:00"}, "tue": {"start": "08:00", "end": "19:00"}, "wed": {"start": "08:00", "end": "19:00"}, "thu": {"start": "08:00", "end": "19:00"}, "fri": {"start": "08:00", "end": "19:00"}, "sat": {"start": "10:00", "end": "18:00"}, "sun": {"start": "10:00", "end": "16:00"}}')
ON CONFLICT DO NOTHING;

-- Insert services for plumber
INSERT INTO services (id, provider_id, name, description, category, subcategory, base_price, price_unit, duration_minutes,
                      coverage_radius_km, images, rating, review_count, is_featured, is_active, location_coverage)
VALUES
  ('850e8400-e29b-41d4-a716-446655440101', '750e8400-e29b-41d4-a716-446655440101', 'Pipe Repair',
   'Fix leaking pipes and water issues quickly and professionally', 'plumbing', 'repairs', 150.00, 'flat_rate', 60,
   15, '{}', 4.8, 85, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9857, 40.7484), 4326)::geography, 15000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440102', '750e8400-e29b-41d4-a716-446655440101', 'Drain Cleaning',
   'Fast and effective drain cleaning service', 'plumbing', 'maintenance', 120.00, 'flat_rate', 45,
   15, '{}', 4.9, 102, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9857, 40.7484), 4326)::geography, 15000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440103', '750e8400-e29b-41d4-a716-446655440101', 'Toilet Installation',
   'Professional toilet installation and repair', 'plumbing', 'installation', 200.00, 'flat_rate', 90,
   15, '{}', 4.7, 35, false, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9857, 40.7484), 4326)::geography, 15000)::geometry)
ON CONFLICT DO NOTHING;

-- Insert services for electrician
INSERT INTO services (id, provider_id, name, description, category, subcategory, base_price, price_unit, duration_minutes,
                      coverage_radius_km, images, rating, review_count, is_featured, is_active, location_coverage)
VALUES
  ('850e8400-e29b-41d4-a716-446655440104', '750e8400-e29b-41d4-a716-446655440102', 'Electrical Repair',
   'Diagnose and fix electrical problems safely', 'electrical', 'repairs', 100.00, 'hourly', 60,
   20, '{}', 4.9, 67, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9776, 40.7580), 4326)::geography, 20000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440105', '750e8400-e29b-41d4-a716-446655440102', 'Outlet Installation',
   'Install new electrical outlets safely', 'electrical', 'installation', 150.00, 'flat_rate', 75,
   20, '{}', 4.8, 28, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9776, 40.7580), 4326)::geography, 20000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440106', '750e8400-e29b-41d4-a716-446655440102', 'Panel Upgrade',
   'Upgrade electrical panel for modern homes', 'electrical', 'installation', 800.00, 'flat_rate', 240,
   20, '{}', 4.9, 12, false, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9776, 40.7580), 4326)::geography, 20000)::geometry)
ON CONFLICT DO NOTHING;

-- Insert services for cleaner
INSERT INTO services (id, provider_id, name, description, category, subcategory, base_price, price_unit, duration_minutes,
                      coverage_radius_km, images, rating, review_count, is_featured, is_active, location_coverage)
VALUES
  ('850e8400-e29b-41d4-a716-446655440107', '750e8400-e29b-41d4-a716-446655440103', 'House Cleaning',
   'Thorough house cleaning service', 'cleaning', 'residential', 150.00, 'hourly', 180,
   12, '{}', 4.7, 98, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9654, 40.7505), 4326)::geography, 12000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440108', '750e8400-e29b-41d4-a716-446655440103', 'Office Cleaning',
   'Professional office cleaning and maintenance', 'cleaning', 'commercial', 200.00, 'hourly', 240,
   12, '{}', 4.8, 45, true, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9654, 40.7505), 4326)::geography, 12000)::geometry),

  ('850e8400-e29b-41d4-a716-446655440109', '750e8400-e29b-41d4-a716-446655440103', 'Window Cleaning',
   'Streak-free window cleaning inside and out', 'cleaning', 'specialized', 75.00, 'flat_rate', 90,
   12, '{}', 4.6, 7, false, true,
   ST_Buffer(ST_SetSRID(ST_Point(-73.9654, 40.7505), 4326)::geography, 12000)::geometry)
ON CONFLICT DO NOTHING;
