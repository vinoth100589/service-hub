import { query } from '@config/database';
import { LocationService } from './locationService';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  qualityTier?: 'good' | 'medium' | 'low';
  priceTier?: 'low' | 'medium' | 'high';
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'newest' | 'rating' | 'best' | 'price-low' | 'price-high' | 'reviews' | 'nearest';
  limit?: number;
  offset?: number;
}

// Quality tier: good (rating >= 4.8), medium (4.5-4.79), low (< 4.5)
const QUALITY_TIER_SQL = `(CASE WHEN s.rating >= 4.8 THEN 'good' WHEN s.rating >= 4.5 THEN 'medium' ELSE 'low' END)`;
// Price tier: low (< $130), medium ($130-$250), high (> $250)
const PRICE_TIER_SQL = `(CASE WHEN s.base_price < 130 THEN 'low' WHEN s.base_price <= 250 THEN 'medium' ELSE 'high' END)`;

export interface CreateServicePayload {
  provider_id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  base_price: number;
  price_unit: 'hourly' | 'flat_rate' | 'project';
  duration_minutes?: number;
  coverage_radius_km?: number;
  images?: string[];
}

export class ServiceService {
  static async listServices(filters: ServiceFilters) {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      minRating = 0,
      qualityTier,
      priceTier,
      latitude,
      longitude,
      radiusKm = 10,
      sortBy = 'newest',
      limit = 20,
      offset = 0,
    } = filters;

    let whereConditions: string[] = [
      's.is_active = true',
      'p.verification_status = \'verified\'',
      's.rating >= $1',
    ];

    let params: any[] = [minRating];
    let paramIndex = 2;

    // Full-text search across name, description, category, and provider business name
    if (q) {
      whereConditions.push(
        `(s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.category ILIKE $${paramIndex} OR p.business_name ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      whereConditions.push(`s.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Price filter
    if (minPrice !== undefined) {
      whereConditions.push(`s.base_price >= $${paramIndex}`);
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      whereConditions.push(`s.base_price <= $${paramIndex}`);
      params.push(maxPrice);
      paramIndex++;
    }

    // Quality tier filter (good/medium/low)
    if (qualityTier) {
      whereConditions.push(`${QUALITY_TIER_SQL} = $${paramIndex}`);
      params.push(qualityTier);
      paramIndex++;
    }

    // Price tier filter (low/medium/high)
    if (priceTier) {
      whereConditions.push(`${PRICE_TIER_SQL} = $${paramIndex}`);
      params.push(priceTier);
      paramIndex++;
    }

    // Location filter
    let distanceField = '';
    if (latitude !== undefined && longitude !== undefined) {
      const radiusMeters = radiusKm * 1000;
      whereConditions.push(
        `ST_DWithin(
          u.location::geography,
          ST_SetSRID(ST_Point($${paramIndex}, $${paramIndex + 1}), 4326)::geography,
          $${paramIndex + 2}
        )`
      );
      distanceField = `ST_Distance(u.location::geography, ST_SetSRID(ST_Point($${paramIndex}, $${paramIndex + 1}), 4326)::geography) / 1000.0 as distance_km,`;
      params.push(longitude, latitude, radiusMeters);
      paramIndex += 3;
    }

    // Build sort clause
    let sortClause = 'ORDER BY s.created_at DESC';
    switch (sortBy) {
      case 'rating':
      case 'best':
        sortClause = 'ORDER BY s.rating DESC, s.review_count DESC';
        break;
      case 'price-low':
        sortClause = 'ORDER BY s.base_price ASC';
        break;
      case 'price-high':
        sortClause = 'ORDER BY s.base_price DESC';
        break;
      case 'reviews':
        sortClause = 'ORDER BY s.review_count DESC, s.rating DESC';
        break;
      case 'nearest':
        if (latitude && longitude) {
          sortClause = `ORDER BY ST_Distance(u.location::geography, ST_SetSRID(ST_Point($${paramIndex - 3}, $${paramIndex - 2}), 4326)::geography) ASC`;
        }
        break;
    }

    // Add pagination params
    params.push(limit, offset);

    const sql = `
      SELECT
        s.id, s.provider_id, s.name, s.description, s.category, s.subcategory,
        s.base_price, s.price_unit, s.duration_minutes, s.rating, s.review_count,
        s.images, s.is_featured, s.is_active, s.created_at,
        ${QUALITY_TIER_SQL} as quality_tier, ${PRICE_TIER_SQL} as price_tier,
        ${distanceField}
        p.id as provider_id, p.business_name, p.average_rating, p.total_reviews,
        p.verification_status, p.response_time_minutes,
        u.id as user_id, u.first_name, u.last_name, u.avatar_url,
        COUNT(*) OVER() as total_count
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ${sortClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await query(sql, params);

    return {
      services: result.rows,
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
      limit,
      offset,
    };
  }

  static async getServiceById(serviceId: string) {
    const result = await query(
      `SELECT
        s.id, s.provider_id, s.name, s.description, s.category, s.subcategory,
        s.base_price, s.price_unit, s.duration_minutes, s.rating, s.review_count,
        s.images, s.is_featured, s.is_active, s.created_at, s.updated_at,
        p.id as provider_id, p.business_name, p.average_rating, p.total_reviews,
        p.verification_status, p.response_time_minutes, p.cancellation_rate,
        u.id as user_id, u.first_name, u.last_name, u.avatar_url, u.bio
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE s.id = $1 AND s.is_active = true`,
      [serviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Service not found');
    }

    return result.rows[0];
  }

  static async createService(payload: CreateServicePayload) {
    const id = uuidv4();

    const result = await query(
      `INSERT INTO services (
        id, provider_id, name, description, category, subcategory,
        base_price, price_unit, duration_minutes, coverage_radius_km, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        payload.provider_id,
        payload.name,
        payload.description,
        payload.category,
        payload.subcategory,
        payload.base_price,
        payload.price_unit,
        payload.duration_minutes,
        payload.coverage_radius_km,
        payload.images,
      ]
    );

    return result.rows[0];
  }

  static async updateService(serviceId: string, updates: Partial<CreateServicePayload>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.base_price !== undefined) {
      fields.push(`base_price = $${paramIndex++}`);
      values.push(updates.base_price);
    }
    if (updates.images !== undefined) {
      fields.push(`images = $${paramIndex++}`);
      values.push(updates.images);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(serviceId);

    const result = await query(
      `UPDATE services SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Service not found');
    }

    return result.rows[0];
  }

  static async deleteService(serviceId: string) {
    const result = await query(
      `UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1
       RETURNING id`,
      [serviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Service not found');
    }

    return { message: 'Service deleted successfully' };
  }

  static async getProviderServices(providerId: string, limit = 20, offset = 0) {
    const result = await query(
      `SELECT
        s.id, s.name, s.description, s.category, s.base_price,
        s.rating, s.review_count, s.images, s.is_active, s.created_at
      FROM services s
      WHERE s.provider_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3`,
      [providerId, limit, offset]
    );

    return result.rows;
  }

  static async getServiceCategories() {
    const result = await query(
      `SELECT DISTINCT category FROM services WHERE is_active = true
       ORDER BY category ASC`
    );

    return result.rows.map((row: any) => row.category);
  }

  static async getFeaturedServices(limit = 10) {
    const result = await query(
      `SELECT
        s.id, s.provider_id, s.name, s.description, s.category,
        s.base_price, s.rating, s.review_count, s.images,
        p.business_name, p.average_rating,
        u.first_name, u.last_name
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE s.is_active = true AND s.is_featured = true
      ORDER BY s.rating DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}
