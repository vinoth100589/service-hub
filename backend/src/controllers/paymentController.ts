import { Request, Response } from 'express';
import { query, getClient } from '@config/database';
import { v4 as uuidv4 } from 'uuid';
import { StripeService } from '@services/stripeService';
import { computeDiscount } from '@controllers/promoController';

export class PaymentController {
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { booking_id, amount, promo_code } = req.body;

      // Get booking & provider
      const bookingResult = await query('SELECT provider_id, status FROM bookings WHERE id = $1 AND user_id = $2', [booking_id, req.user.id]);
      if (!bookingResult.rows.length) return res.status(400).json({ error: 'Booking not found' });
      if (bookingResult.rows[0].status !== 'accepted') {
        return res.status(400).json({ error: 'Booking must be accepted by the provider before payment' });
      }

      const existingPayment = await query('SELECT id FROM payments WHERE booking_id = $1', [booking_id]);
      if (existingPayment.rows.length) {
        return res.status(400).json({ error: 'A payment already exists for this booking' });
      }

      // A promo discounts what the customer is actually charged; the
      // platform's commission (and so the provider's payout) is computed
      // on that discounted amount rather than the original listed price —
      // the promo's cost is shared between platform and provider, not
      // absorbed entirely by one side.
      let discountAmount = 0;
      let promoId: string | null = null;
      if (promo_code) {
        try {
          const { promo, discount } = await computeDiscount(promo_code, req.user.id, amount);
          discountAmount = discount;
          promoId = promo.id;
        } catch (promoError: any) {
          return res.status(400).json({ error: promoError.message });
        }
      }
      const chargedAmount = Number((amount - discountAmount).toFixed(2));

      const paymentId = uuidv4();
      const feeAmount = Number((chargedAmount * 0.15).toFixed(2)); // 15% commission
      const providerAmount = Number((chargedAmount - feeAmount).toFixed(2));

      // Falls back to a mock intent (no real charge) when STRIPE_SECRET_KEY
      // isn't set — same call site works unmodified once real keys land.
      const intent = await StripeService.createPaymentIntent(chargedAmount, 'usd', { booking_id, payment_id: paymentId });

      const client = await getClient();
      try {
        await client.query('BEGIN');

        const result = await client.query(
          `INSERT INTO payments (id, booking_id, user_id, provider_id, amount, status, fee_amount, provider_payout_amount, stripe_payment_intent_id, promo_code_id, discount_amount)
           VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
           RETURNING *`,
          [paymentId, booking_id, req.user.id, bookingResult.rows[0].provider_id, chargedAmount, feeAmount, providerAmount, intent.id, promoId, discountAmount]
        );

        if (promoId) {
          await client.query(
            `INSERT INTO promo_redemptions (id, promo_code_id, user_id, payment_id, discount_amount) VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), promoId, req.user.id, paymentId, discountAmount]
          );
          await client.query(`UPDATE promo_codes SET redemption_count = redemption_count + 1 WHERE id = $1`, [promoId]);
        }

        await client.query('COMMIT');

        return res.status(201).json({
          message: 'Payment intent created',
          data: {
            ...result.rows[0],
            client_secret: intent.client_secret,
          }
        });
      } catch (error: any) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async confirmPayment(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { payment_id, stripe_charge_id } = req.body;

      const payment = await query('SELECT stripe_payment_intent_id FROM payments WHERE id = $1 AND user_id = $2', [payment_id, req.user.id]);
      if (!payment.rows.length) return res.status(404).json({ error: 'Payment not found' });

      // When Stripe is actually configured, trust the payment intent's status
      // from Stripe's own API rather than a client-supplied charge id — a
      // client can lie about stripe_charge_id, it can't fake Stripe's response.
      if (StripeService.isConfigured()) {
        const intentId = payment.rows[0].stripe_payment_intent_id;
        const intent = intentId ? await StripeService.retrievePaymentIntent(intentId) : null;
        if (!intent || intent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment has not succeeded with Stripe yet' });
        }
      }

      const result = await query(
        `UPDATE payments SET status = 'completed', stripe_charge_id = $2, processed_at = NOW()
         WHERE id = $1 AND user_id = $3
         RETURNING *`,
        [payment_id, stripe_charge_id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });

      // Only advance a booking that's still accepted — it may have been
      // cancelled between createPaymentIntent's check and this confirmation,
      // and a completed payment shouldn't silently revive a cancelled booking.
      await query(
        `UPDATE bookings SET status = 'in_progress'
         WHERE id = (SELECT booking_id FROM payments WHERE id = $1) AND status = 'accepted'`,
        [payment_id]
      );

      return res.status(200).json({ message: 'Payment confirmed', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPayment(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT p.* FROM payments p
         LEFT JOIN providers pr ON p.provider_id = pr.id
         WHERE p.id = $1 AND (p.user_id = $2 OR pr.user_id = $2)`,
        [req.params.id, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
      return res.status(200).json({ data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listUserPayments(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { limit = 20, offset = 0 } = req.query;
      const result = await query(
        `SELECT p.*, s.name FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );

      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async requestRefund(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const { id } = req.params;

      const existing = await query(
        `SELECT stripe_payment_intent_id, amount FROM payments WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
        [id, req.user.id]
      );
      if (!existing.rows.length) return res.status(404).json({ error: 'Payment not found' });

      const refund = existing.rows[0].stripe_payment_intent_id
        ? await StripeService.createRefund(existing.rows[0].stripe_payment_intent_id)
        : { id: null };

      const result = await query(
        `UPDATE payments SET status = 'refunded', refunded_at = NOW(), stripe_refund_id = $2
         WHERE id = $1 AND user_id = $3 AND status = 'completed'
         RETURNING *`,
        [id, refund.id, req.user.id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
      return res.status(200).json({ message: 'Refund processed', data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Stripe calls this directly (not through the mobile/web client), so it
  // authenticates via the webhook signature instead of a user JWT. Mounted
  // in app.ts ahead of express.json() so req.body arrives as a raw Buffer —
  // signature verification needs the exact original bytes.
  static async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    let event;
    try {
      event = StripeService.constructWebhookEvent(req.body as Buffer, signature);
    } catch (error: any) {
      return res.status(400).json({ error: `Webhook signature verification failed: ${error.message}` });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object as { id: string };
          await query(
            `UPDATE payments SET status = 'completed', processed_at = NOW() WHERE stripe_payment_intent_id = $1 AND status != 'completed'`,
            [intent.id]
          );
          await query(
            `UPDATE bookings SET status = 'in_progress'
             WHERE id = (SELECT booking_id FROM payments WHERE stripe_payment_intent_id = $1) AND status = 'accepted'`,
            [intent.id]
          );
          break;
        }
        case 'payment_intent.payment_failed': {
          const intent = event.data.object as { id: string };
          await query(
            `UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = $1`,
            [intent.id]
          );
          break;
        }
        default:
          break; // Unhandled event types are intentionally ignored
      }
      return res.status(200).json({ received: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPayouts(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

      const result = await query(
        `SELECT p.*, s.name FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         WHERE p.provider_id = (SELECT id FROM providers WHERE user_id = $1)
         AND p.status = 'completed'
         ORDER BY p.processed_at DESC`,
        [req.user.id]
      );

      // provider_payout_amount is a DECIMAL column — pg returns it as a string,
      // so summing it with plain `+` against a numeric accumulator would
      // silently string-concatenate every row instead of adding them.
      const totalEarnings = Number(
        result.rows
          .reduce((sum: number, row: any) => sum + (parseFloat(row.provider_payout_amount) || 0), 0)
          .toFixed(2)
      );

      return res.status(200).json({
        data: result.rows,
        total_earnings: totalEarnings
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
