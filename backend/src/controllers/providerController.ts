import { Request, Response } from 'express';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export class ProviderController {
  static async applyAsProvider(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { business_name, business_description, service_categories } = req.body;

      if (!business_name) {
        return res.status(400).json({ error: 'Business name is required' });
      }

      // Check if already a provider
      const existingProvider = await query(
        'SELECT id FROM providers WHERE user_id = $1',
        [req.user.id]
      );

      if (existingProvider.rows.length > 0) {
        return res.status(400).json({ error: 'User is already a provider' });
      }

      const providerId = uuidv4();

      const result = await query(
        `INSERT INTO providers (id, user_id, business_name, business_description, service_categories, verification_status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [providerId, req.user.id, business_name, business_description, service_categories]
      );

      // Grant provider-only access (services stay hidden from public listings until verified)
      await query(`UPDATE users SET user_type = 'provider' WHERE id = $1`, [req.user.id]);

      return res.status(201).json({
        message: 'Provider application submitted successfully. Log in again to access provider features.',
        data: result.rows[0],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProviderProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const result = await query(
        `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.avatar_url
         FROM providers p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Provider profile not found' });
      }

      return res.status(200).json({
        message: 'Provider profile retrieved',
        data: result.rows[0],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateProviderSettings(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const {
        business_name,
        business_description,
        service_categories,
        response_time_minutes,
      } = req.body;

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (business_name !== undefined) {
        updateFields.push(`business_name = $${paramIndex++}`);
        values.push(business_name);
      }
      if (business_description !== undefined) {
        updateFields.push(`business_description = $${paramIndex++}`);
        values.push(business_description);
      }
      if (service_categories !== undefined) {
        updateFields.push(`service_categories = $${paramIndex++}`);
        values.push(service_categories);
      }
      if (response_time_minutes !== undefined) {
        updateFields.push(`response_time_minutes = $${paramIndex++}`);
        values.push(response_time_minutes);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(req.user.id);

      const result = await query(
        `UPDATE providers SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      return res.status(200).json({
        message: 'Provider settings updated',
        data: result.rows[0],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateAvailability(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { availability } = req.body;

      if (!availability) {
        return res.status(400).json({ error: 'Availability schedule is required' });
      }

      const result = await query(
        `UPDATE providers SET availability = $1, updated_at = NOW() WHERE user_id = $2
         RETURNING *`,
        [JSON.stringify(availability), req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      return res.status(200).json({
        message: 'Availability updated',
        data: result.rows[0],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
