import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '@services/notificationService';

export class BookingController {
  static async createBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { service_id, scheduled_date, scheduled_duration_minutes, service_address, notes } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      // Get service + provider details
      const serviceResult = await query(
        `SELECT s.provider_id, s.name, p.user_id as provider_user_id
         FROM services s JOIN providers p ON s.provider_id = p.id
         WHERE s.id = $1`,
        [service_id]
      );
      if (!serviceResult.rows.length) return res.status(404).json({ error: 'Service not found' });
      const { provider_id, name: serviceName, provider_user_id } = serviceResult.rows[0];

      const bookingId = uuidv4();
      const result = await query(
        `INSERT INTO bookings (id, user_id, provider_id, service_id, status, scheduled_date, scheduled_duration_minutes, service_address, notes)
         VALUES ($1, $2, $3, $4, 'requested', $5, $6, $7, $8)
         RETURNING *`,
        [bookingId, req.user.id, provider_id, service_id, scheduled_date, scheduled_duration_minutes, service_address, notes]
      );

      NotificationService.create(
        provider_user_id,
        'booking_requested',
        'New booking request',
        `You have a new request for ${serviceName}`,
        bookingId
      );

      return res.status(201).json({ message: 'Booking created', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT b.*, s.name, s.base_price, p.business_name, p.user_id as provider_user_id,
                cu.first_name as customer_first_name, cu.last_name as customer_last_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN providers p ON b.provider_id = p.id
         JOIN users cu ON b.user_id = cu.id
         WHERE b.id = $1`,
        [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });

      const booking = result.rows[0];
      const isCustomer = booking.user_id === req.user.id;
      const isProvider = booking.provider_user_id === req.user.id;
      if (!isCustomer && !isProvider) {
        return res.status(403).json({ error: 'Not a participant in this booking' });
      }

      return res.status(200).json({
        data: { ...booking, viewer_role: isCustomer ? 'customer' : 'provider' },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listUserBookings(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { limit = 20, offset = 0 } = req.query;
      const result = await query(
        `SELECT b.*, s.name, s.base_price, p.business_name, p.user_id as provider_user_id,
                cu.first_name as customer_first_name, cu.last_name as customer_last_name,
                CASE WHEN b.user_id = $1 THEN 'customer' ELSE 'provider' END as viewer_role
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN providers p ON b.provider_id = p.id
         JOIN users cu ON b.user_id = cu.id
         WHERE b.user_id = $1 OR b.provider_id IN (SELECT id FROM providers WHERE user_id = $1)
         ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async acceptBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `UPDATE bookings b SET status = 'accepted', accepted_at = NOW()
         WHERE b.id = $1 AND b.provider_id = (SELECT id FROM providers WHERE user_id = $2)
           AND b.status = 'requested'
         RETURNING *, (SELECT name FROM services WHERE id = b.service_id) as service_name`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
      const booking = result.rows[0];
      NotificationService.create(
        booking.user_id,
        'booking_accepted',
        'Booking accepted',
        `Your request for ${booking.service_name} was accepted`,
        booking.id
      );
      return res.status(200).json({ message: 'Booking accepted', data: booking });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async rejectBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `UPDATE bookings b SET status = 'rejected', cancelled_at = NOW(), cancelled_by = 'provider'
         WHERE b.id = $1 AND b.provider_id = (SELECT id FROM providers WHERE user_id = $2)
           AND b.status = 'requested'
         RETURNING *, (SELECT name FROM services WHERE id = b.service_id) as service_name`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
      const booking = result.rows[0];
      NotificationService.create(
        booking.user_id,
        'booking_rejected',
        'Booking declined',
        `Your request for ${booking.service_name} was declined`,
        booking.id
      );
      return res.status(200).json({ message: 'Booking rejected', data: booking });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async completeBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `UPDATE bookings b SET status = 'completed', completed_at = NOW()
         WHERE b.id = $1 AND (b.user_id = $2 OR b.provider_id = (SELECT id FROM providers WHERE user_id = $2))
           AND b.status = 'accepted'
         RETURNING *, (SELECT name FROM services WHERE id = b.service_id) as service_name,
                   (SELECT user_id FROM providers WHERE id = b.provider_id) as provider_user_id`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
      const booking = result.rows[0];
      // Notify whichever party didn't take the action
      const notifyUserId = req.user.id === booking.user_id ? booking.provider_user_id : booking.user_id;
      NotificationService.create(
        notifyUserId,
        'booking_completed',
        'Booking completed',
        `${booking.service_name} has been marked completed`,
        booking.id
      );
      return res.status(200).json({ message: 'Booking completed', data: booking });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async cancelBooking(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = 'user'
         WHERE id = $1 AND user_id = $2 AND status IN ('requested', 'accepted')
         RETURNING *`,
        [req.params.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json({ message: 'Booking cancelled', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
