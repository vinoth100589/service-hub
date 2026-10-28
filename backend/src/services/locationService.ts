import { query } from '@config/database';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export class LocationService {
  // Find services within radius of a location
  static async findServicesNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 50,
    offset: number = 0
  ) {
    const radiusMeters = radiusKm * 1000;

    const result = await query(
      `SELECT
        s.id, s.provider_id, s.name, s.description, s.category, s.subcategory,
        s.base_price, s.price_unit, s.duration_minutes, s.rating, s.review_count,
        s.images, s.is_featured, s.is_active,
        p.user_id, p.business_name, p.average_rating, p.total_reviews, p.verification_status,
        u.first_name, u.last_name, u.avatar_url,
        ST_Distance(u.location::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography) as distance_meters,
        COUNT(*) OVER() as total_count
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE s.is_active = true
        AND p.verification_status = 'verified'
        AND ST_DWithin(
          u.location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography,
          $3
        )
      ORDER BY distance_meters ASC
      LIMIT $4 OFFSET $5`,
      [longitude, latitude, radiusMeters, limit, offset]
    );

    return {
      services: result.rows.map((row: any) => ({
        ...row,
        distance_km: (row.distance_meters / 1000).toFixed(2),
      })),
      total: result.rows.length > 0 ? result.rows[0].total_count : 0,
    };
  }

  // Calculate distance between two points
  static async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): Promise<number> {
    const result = await query(
      `SELECT ST_Distance(
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        ST_SetSRID(ST_Point($3, $4), 4326)::geography
      ) as distance_meters`,
      [lng1, lat1, lng2, lat2]
    );

    return result.rows[0].distance_meters;
  }

  // Check if location is within service coverage area
  static async isLocationInCoverage(
    serviceId: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    const result = await query(
      `SELECT ST_Contains(location_coverage, ST_SetSRID(ST_Point($1, $2), 4326)) as is_covered
       FROM services
       WHERE id = $3`,
      [longitude, latitude, serviceId]
    );

    return result.rows[0]?.is_covered || false;
  }

  // Get services in a specific category near location
  static async findServicesByCategory(
    category: string,
    latitude?: number,
    longitude?: number,
    radiusKm?: number
  ) {
    let whereClause = `WHERE s.category = $1 AND s.is_active = true AND p.verification_status = 'verified'`;
    let params: any[] = [category];
    let paramIndex = 2;

    if (latitude !== undefined && longitude !== undefined && radiusKm !== undefined) {
      const radiusMeters = radiusKm * 1000;
      whereClause += ` AND ST_DWithin(
        s.location_coverage::geography,
        ST_SetSRID(ST_Point($${paramIndex}, $${paramIndex + 1}), 4326)::geography,
        $${paramIndex + 2}
      )`;
      params.push(longitude, latitude, radiusMeters);
      paramIndex += 3;
    }

    const result = await query(
      `SELECT
        s.id, s.provider_id, s.name, s.description, s.base_price,
        s.rating, s.review_count, s.images,
        p.business_name, p.average_rating, p.total_reviews,
        u.first_name, u.last_name, u.avatar_url
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY s.rating DESC, s.review_count DESC`,
      params
    );

    return result.rows;
  }
}
