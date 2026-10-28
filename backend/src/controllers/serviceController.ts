import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ServiceService, ServiceFilters } from '@services/serviceService';
import { LocationService } from '@services/locationService';
import { query } from '@config/database';

export class ServiceController {
  static async listServices(req: Request, res: Response) {
    try {
      const {
        q,
        category,
        minPrice,
        maxPrice,
        minRating,
        qualityTier,
        priceTier,
        latitude,
        longitude,
        radiusKm,
        sortBy,
        limit,
        offset,
      } = req.query;

      const filters: ServiceFilters = {
        q: q as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minRating: minRating ? parseFloat(minRating as string) : 0,
        qualityTier: qualityTier as any,
        priceTier: priceTier as any,
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        radiusKm: radiusKm ? parseFloat(radiusKm as string) : 10,
        sortBy: (sortBy as any) || 'newest',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      };

      const result = await ServiceService.listServices(filters);

      return res.status(200).json({
        message: 'Services retrieved successfully',
        data: result.services,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getServiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const service = await ServiceService.getServiceById(id);

      // Get reviews for this service
      const reviewsResult = await query(
        `SELECT r.*, u.first_name, u.last_name, u.avatar_url
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         WHERE r.booking_id IN (
           SELECT id FROM bookings WHERE service_id = $1 AND status = 'completed'
         )
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [id]
      );

      return res.status(200).json({
        message: 'Service retrieved successfully',
        data: {
          ...service,
          recent_reviews: reviewsResult.rows,
        },
      });
    } catch (error: any) {
      if (error.message === 'Service not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async nearbyServices(req: Request, res: Response) {
    try {
      const { latitude, longitude, radiusKm = 10, limit = 50 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'latitude and longitude are required',
        });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radius = radiusKm ? parseFloat(radiusKm as string) : 10;

      const result = await LocationService.findServicesNearby(
        lat,
        lng,
        radius,
        parseInt(limit as string) || 50
      );

      return res.status(200).json({
        message: 'Nearby services retrieved successfully',
        data: result.services,
        pagination: {
          total: result.total,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createService(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user is a provider
      const providerResult = await query(
        'SELECT id FROM providers WHERE user_id = $1',
        [req.user.id]
      );

      if (providerResult.rows.length === 0) {
        return res.status(403).json({ error: 'User is not a provider' });
      }

      const providerId = providerResult.rows[0].id;

      const service = await ServiceService.createService({
        provider_id: providerId,
        ...req.body,
      });

      return res.status(201).json({
        message: 'Service created successfully',
        data: service,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateService(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      // Check if user owns this service
      const serviceResult = await query(
        `SELECT s.*, p.user_id FROM services s
         JOIN providers p ON s.provider_id = p.id
         WHERE s.id = $1`,
        [id]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      if (serviceResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this service' });
      }

      const service = await ServiceService.updateService(id, req.body);

      return res.status(200).json({
        message: 'Service updated successfully',
        data: service,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteService(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      // Check if user owns this service
      const serviceResult = await query(
        `SELECT s.*, p.user_id FROM services s
         JOIN providers p ON s.provider_id = p.id
         WHERE s.id = $1`,
        [id]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      if (serviceResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this service' });
      }

      await ServiceService.deleteService(id);

      return res.status(200).json({
        message: 'Service deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await ServiceService.getServiceCategories();

      return res.status(200).json({
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getFeaturedServices(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const services = await ServiceService.getFeaturedServices(
        parseInt(limit as string) || 10
      );

      return res.status(200).json({
        message: 'Featured services retrieved successfully',
        data: services,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProviderProfile(req: Request, res: Response) {
    try {
      const { providerId } = req.params;

      const providerResult = await query(
        `SELECT
          p.id, p.business_name, p.business_description, p.verification_status,
          p.average_rating, p.total_reviews, p.total_bookings,
          p.response_time_minutes, p.cancellation_rate, p.service_categories,
          u.id as user_id, u.first_name, u.last_name, u.avatar_url, u.bio, u.phone,
          u.address
        FROM providers p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1`,
        [providerId]
      );

      if (providerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      const provider = providerResult.rows[0];

      // Get provider's services
      const servicesResult = await query(
        `SELECT id, name, description, category, base_price, rating, review_count, images
         FROM services
         WHERE provider_id = $1 AND is_active = true
         ORDER BY rating DESC
         LIMIT 10`,
        [providerId]
      );

      // Get recent reviews
      const reviewsResult = await query(
        `SELECT r.id, r.rating, r.title, r.content, r.created_at,
                u.first_name, u.last_name, u.avatar_url
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         WHERE r.reviewee_id = (SELECT user_id FROM providers WHERE id = $1)
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [providerId]
      );

      return res.status(200).json({
        message: 'Provider profile retrieved successfully',
        data: {
          ...provider,
          services: servicesResult.rows,
          recent_reviews: reviewsResult.rows,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProviderServices(req: Request, res: Response) {
    try {
      const { providerId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const services = await ServiceService.getProviderServices(
        providerId,
        parseInt(limit as string) || 20,
        parseInt(offset as string) || 0
      );

      return res.status(200).json({
        message: 'Provider services retrieved successfully',
        data: services,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
