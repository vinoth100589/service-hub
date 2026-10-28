import { Request, Response } from 'express';
import { query } from '@config/database';

export class AdminController {
  static async getDashboard(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [usersResult, providersResult, bookingsResult, paymentsResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM users WHERE user_type = \'customer\''),
        query('SELECT COUNT(*) as count FROM providers WHERE verification_status = \'verified\''),
        query('SELECT COUNT(*) as count FROM bookings WHERE status = \'completed\''),
        query('SELECT SUM(amount) as total_revenue FROM payments WHERE status = \'completed\''),
      ]);

      return res.status(200).json({
        data: {
          total_customers: parseInt(usersResult.rows[0].count),
          verified_providers: parseInt(providersResult.rows[0].count),
          completed_bookings: parseInt(bookingsResult.rows[0].count),
          total_revenue: parseFloat(paymentsResult.rows[0].total_revenue) || 0,
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listPendingProviders(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await query(
        `SELECT p.*, u.email, u.first_name, u.last_name FROM providers p
         JOIN users u ON p.user_id = u.id
         WHERE p.verification_status = 'pending'
         ORDER BY p.created_at DESC`
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async verifyProvider(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { provider_id } = req.params;

      const result = await query(
        `UPDATE providers SET verification_status = 'verified', verified_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [provider_id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Provider not found' });
      return res.status(200).json({ message: 'Provider verified', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async rejectProvider(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { provider_id } = req.params;

      const result = await query(
        `UPDATE providers SET verification_status = 'rejected'
         WHERE id = $1
         RETURNING *`,
        [provider_id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Provider not found' });
      return res.status(200).json({ message: 'Provider rejected', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listDisputes(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await query(
        `SELECT d.*, u.first_name, u.last_name FROM disputes d
         JOIN users u ON d.initiated_by = u.id
         WHERE d.status IN ('open', 'under_review')
         ORDER BY d.created_at DESC`
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async resolveDispute(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { dispute_id } = req.params;
      const { resolution, refund_amount } = req.body;

      const result = await query(
        `UPDATE disputes SET status = 'resolved', resolution = $2, refund_amount = $3, resolved_by_admin = $4, resolved_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [dispute_id, resolution, refund_amount, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Dispute not found' });
      return res.status(200).json({ message: 'Dispute resolved', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [revenue, bookings, reviews] = await Promise.all([
        query(`SELECT DATE(created_at) as date, SUM(amount) as revenue FROM payments WHERE status = 'completed' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`),
        query(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`),
        query(`SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews`),
      ]);

      return res.status(200).json({
        data: {
          revenue_by_day: revenue.rows,
          bookings_by_status: bookings.rows,
          review_stats: reviews.rows[0],
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
