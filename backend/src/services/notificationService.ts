import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'message_received'
  | 'review_posted'
  | 'payment_received'
  | 'dispute_resolved';

export class NotificationService {
  // Fire-and-forget: a failed notification insert should never break the
  // action that triggered it (accepting a booking, sending a message, etc).
  static async create(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    relatedEntityId?: string
  ) {
    try {
      await query(
        `INSERT INTO notifications (id, user_id, type, title, content, related_entity_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), userId, type, title, content, relatedEntityId || null]
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }
}
