import { Request, Response } from 'express';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export class DisputeController {
  static async createDispute(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { booking_id, title, description, evidence_urls } = req.body;
      if (!booking_id || !title || !description) {
        return res.status(400).json({ error: 'booking_id, title, and description are required' });
      }

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

      const existing = await query(
        `SELECT id FROM disputes WHERE booking_id = $1 AND status IN ('open', 'under_review')`,
        [booking_id]
      );
      if (existing.rows.length) {
        return res.status(400).json({ error: 'An open dispute already exists for this booking' });
      }

      const disputeId = uuidv4();
      const result = await query(
        `INSERT INTO disputes (id, booking_id, initiated_by, title, description, evidence_urls)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [disputeId, booking_id, req.user.id, title, description, evidence_urls || null]
      );

      return res.status(201).json({ message: 'Dispute filed', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDispute(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT d.*, b.user_id as customer_id, p.user_id as provider_user_id
         FROM disputes d
         JOIN bookings b ON d.booking_id = b.id
         JOIN providers p ON b.provider_id = p.id
         WHERE d.id = $1`,
        [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Dispute not found' });

      const dispute = result.rows[0];
      const isParticipant = req.user.id === dispute.customer_id || req.user.id === dispute.provider_user_id;
      if (!isParticipant && req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this dispute' });
      }

      return res.status(200).json({ data: dispute });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listMyDisputes(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT d.*, s.name as service_name FROM disputes d
         JOIN bookings b ON d.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         JOIN providers p ON b.provider_id = p.id
         WHERE d.initiated_by = $1 OR b.user_id = $1 OR p.user_id = $1
         ORDER BY d.created_at DESC`,
        [req.user.id]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
