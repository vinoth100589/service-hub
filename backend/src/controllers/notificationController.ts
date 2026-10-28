import { Request, Response } from 'express';
import { query } from '@config/database';

export class NotificationController {
  static async listNotifications(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { limit = 30, offset = 0 } = req.query;
      const result = await query(
        `SELECT * FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
      const unreadResult = await query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
        [req.user.id]
      );

      return res.status(200).json({
        data: result.rows,
        unread_count: parseInt(unreadResult.rows[0].count),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `UPDATE notifications SET is_read = true, read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [req.params.id, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Notification not found' });

      return res.status(200).json({ data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      await query(
        `UPDATE notifications SET is_read = true, read_at = NOW()
         WHERE user_id = $1 AND is_read = false`,
        [req.user.id]
      );

      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
