import { Request, Response } from 'express';
import { query, getClient } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '@services/notificationService';

export class ReviewController {
  static async submitReview(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { booking_id, rating, title, content, cleanliness_rating, professionalism_rating, punctuality_rating, value_rating } = req.body;

      // Get booking & provider's user id (the reviewee)
      const bookingResult = await query(
        `SELECT p.user_id as reviewee_id FROM bookings b
         JOIN providers p ON b.provider_id = p.id
         WHERE b.id = $1 AND b.user_id = $2 AND b.status = 'completed'`,
        [booking_id, req.user.id]
      );
      if (!bookingResult.rows.length) return res.status(400).json({ error: 'Invalid or incomplete booking' });

      const reviewId = uuidv4();
      const result = await query(
        `INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, rating, title, content, cleanliness_rating, professionalism_rating, punctuality_rating, value_rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [reviewId, booking_id, req.user.id, bookingResult.rows[0].reviewee_id, rating, title, content, cleanliness_rating, professionalism_rating, punctuality_rating, value_rating]
      );

      // Update provider average rating
      const ratingResult = await query(
        `UPDATE providers SET average_rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1),
         total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1)
         WHERE user_id = $1 RETURNING average_rating, total_reviews`,
        [bookingResult.rows[0].reviewee_id]
      );

      NotificationService.create(
        bookingResult.rows[0].reviewee_id,
        'review_posted',
        'New review',
        title ? `"${title}" — ${rating}★` : `You received a ${rating}★ review`,
        reviewId
      );

      return res.status(201).json({ message: 'Review submitted', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getReview(req: Request, res: Response) {
    try {
      const result = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
      return res.status(200).json({ data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listProviderReviews(req: Request, res: Response) {
    try {
      const { providerId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const result = await query(
        `SELECT r.*, u.first_name, u.last_name, u.avatar_url FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         WHERE r.reviewee_id = (SELECT user_id FROM providers WHERE id = $1)
         ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
        [providerId, limit, offset]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateReview(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { id } = req.params;
      const { rating, content } = req.body;

      const result = await query(
        `UPDATE reviews SET rating = COALESCE($2, rating), content = COALESCE($3, content), updated_at = NOW()
         WHERE id = $1 AND reviewer_id = $4
         RETURNING *`,
        [id, rating, content, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
      return res.status(200).json({ message: 'Review updated', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async toggleHelpful(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const reviewCheck = await client.query('SELECT id FROM reviews WHERE id = $1', [id]);
      if (!reviewCheck.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Review not found' });
      }

      const removed = await client.query(
        'DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.id]
      );

      let voted: boolean;
      if (removed.rows.length > 0) {
        await client.query('UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = $1', [id]);
        voted = false;
      } else {
        await client.query(
          'INSERT INTO review_helpful_votes (id, review_id, user_id) VALUES ($1, $2, $3)',
          [uuidv4(), id, req.user.id]
        );
        await client.query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [id]);
        voted = true;
      }

      const result = await client.query('SELECT helpful_count FROM reviews WHERE id = $1', [id]);
      await client.query('COMMIT');

      return res.status(200).json({
        message: voted ? 'Marked as helpful' : 'Helpful vote removed',
        data: { review_id: id, helpful_count: result.rows[0].helpful_count, voted },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  static async deleteReview(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query('DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING id', [req.params.id, req.user.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });

      return res.status(200).json({ message: 'Review deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
