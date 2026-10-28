import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export class FavoriteController {
  static async listFavorites(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT f.id as favorite_id, f.created_at as favorited_at,
                p.id as provider_id, p.business_name, p.average_rating, p.total_reviews,
                p.verification_status, p.service_categories,
                u.first_name, u.last_name, u.avatar_url
         FROM favorites f
         JOIN providers p ON f.provider_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [req.user.id]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addFavorite(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { provider_id } = req.body;

      const providerCheck = await query('SELECT id FROM providers WHERE id = $1', [provider_id]);
      if (!providerCheck.rows.length) return res.status(404).json({ error: 'Provider not found' });

      const existing = await query(
        'SELECT id FROM favorites WHERE user_id = $1 AND provider_id = $2',
        [req.user.id, provider_id]
      );
      if (existing.rows.length) {
        return res.status(200).json({ message: 'Already saved', data: existing.rows[0] });
      }

      const result = await query(
        `INSERT INTO favorites (id, user_id, provider_id) VALUES ($1, $2, $3) RETURNING *`,
        [uuidv4(), req.user.id, provider_id]
      );

      return res.status(201).json({ message: 'Provider saved', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async removeFavorite(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { providerId } = req.params;
      const result = await query(
        'DELETE FROM favorites WHERE user_id = $1 AND provider_id = $2 RETURNING id',
        [req.user.id, providerId]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Not in favorites' });
      return res.status(200).json({ message: 'Provider removed from favorites' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
