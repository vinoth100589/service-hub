import { Request, Response } from 'express';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '@services/notificationService';

export class MessageController {
  static async sendMessage(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { booking_id, receiver_id, content, file_url } = req.body;

      // Verify sender is a participant in this booking
      const participantCheck = await query(
        `SELECT b.user_id as customer_id, p.user_id as provider_user_id
         FROM bookings b JOIN providers p ON b.provider_id = p.id
         WHERE b.id = $1`,
        [booking_id]
      );
      if (!participantCheck.rows.length) return res.status(404).json({ error: 'Booking not found' });

      const { customer_id, provider_user_id } = participantCheck.rows[0];
      if (req.user.id !== customer_id && req.user.id !== provider_user_id) {
        return res.status(403).json({ error: 'Not a participant in this booking' });
      }

      // The only other participant a message in this booking can go to — never
      // trust the client's receiver_id, or any participant could address a
      // message (and its notification) to an arbitrary third-party user.
      const otherParticipantId = req.user.id === customer_id ? provider_user_id : customer_id;
      if (receiver_id !== otherParticipantId) {
        return res.status(400).json({ error: 'receiver_id must be the other participant in this booking' });
      }

      const messageId = uuidv4();
      const result = await query(
        `INSERT INTO messages (id, booking_id, sender_id, receiver_id, content, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [messageId, booking_id, req.user.id, receiver_id, content, file_url]
      );

      NotificationService.create(
        receiver_id,
        'message_received',
        'New message',
        content.length > 80 ? `${content.slice(0, 80)}…` : content,
        booking_id
      );

      return res.status(201).json({ message: 'Message sent', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getBookingMessages(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { booking_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const participantCheck = await query(
        `SELECT b.user_id as customer_id, p.user_id as provider_user_id
         FROM bookings b JOIN providers p ON b.provider_id = p.id
         WHERE b.id = $1`,
        [booking_id]
      );
      if (!participantCheck.rows.length) return res.status(404).json({ error: 'Booking not found' });

      const { customer_id, provider_user_id } = participantCheck.rows[0];
      if (req.user.id !== customer_id && req.user.id !== provider_user_id) {
        return res.status(403).json({ error: 'Not a participant in this booking' });
      }

      const result = await query(
        `SELECT m.*, u.first_name, u.last_name FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.booking_id = $1
         ORDER BY m.created_at ASC
         LIMIT $2 OFFSET $3`,
        [booking_id, limit, offset]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getConversations(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT DISTINCT b.*, s.name,
         CASE WHEN b.user_id = $1 THEN p.business_name ELSE cu.first_name || ' ' || cu.last_name END as other_user_name,
         CASE WHEN b.user_id = $1 THEN p.user_id ELSE b.user_id END as other_user_id,
         m.content as last_message, m.created_at as last_message_time
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN providers p ON b.provider_id = p.id
         JOIN users cu ON b.user_id = cu.id
         LEFT JOIN LATERAL (SELECT content, created_at FROM messages WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) m ON true
         WHERE b.user_id = $1 OR b.provider_id IN (SELECT id FROM providers WHERE user_id = $1)
         ORDER BY m.created_at DESC NULLS LAST`,
        [req.user.id]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      // Only the receiver can mark a message read — without this a message id
      // alone would let any authenticated user flip another user's messages.
      const result = await query(
        `UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1 AND receiver_id = $2 RETURNING *`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Message not found' });
      return res.status(200).json({ message: 'Message marked as read', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteMessage(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Message not found' });
      return res.status(200).json({ message: 'Message deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
