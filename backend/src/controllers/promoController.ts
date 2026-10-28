import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

// Shared by validatePromo (preview, no side effects) and paymentController
// (actually redeeming). Returns the discount in dollars, or throws with a
// user-facing message for any reason the code can't be applied right now.
export async function computeDiscount(code: string, userId: string, bookingAmount: number) {
  const result = await query(
    `SELECT * FROM promo_codes WHERE code = $1 AND is_active = true`,
    [code.trim().toUpperCase()]
  );
  if (!result.rows.length) throw new Error('Invalid promo code');

  const promo = result.rows[0];
  const now = new Date();
  if (promo.valid_from && new Date(promo.valid_from) > now) throw new Error('This promo code is not active yet');
  if (promo.valid_until && new Date(promo.valid_until) < now) throw new Error('This promo code has expired');
  if (promo.max_redemptions !== null && promo.redemption_count >= promo.max_redemptions) {
    throw new Error('This promo code has reached its redemption limit');
  }
  if (promo.min_booking_amount && bookingAmount < parseFloat(promo.min_booking_amount)) {
    throw new Error(`This code requires a minimum booking of $${promo.min_booking_amount}`);
  }

  const userRedemptions = await query(
    `SELECT COUNT(*) as count FROM promo_redemptions WHERE promo_code_id = $1 AND user_id = $2`,
    [promo.id, userId]
  );
  if (parseInt(userRedemptions.rows[0].count) >= promo.max_redemptions_per_user) {
    throw new Error("You've already used this promo code");
  }

  let discount =
    promo.discount_type === 'percent'
      ? bookingAmount * (parseFloat(promo.discount_value) / 100)
      : parseFloat(promo.discount_value);
  if (promo.max_discount_amount) {
    discount = Math.min(discount, parseFloat(promo.max_discount_amount));
  }
  discount = Math.min(Number(discount.toFixed(2)), bookingAmount);

  return { promo, discount };
}

export class PromoController {
  static async validatePromo(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const { code, booking_amount } = req.body;

      const { discount } = await computeDiscount(code, req.user.id, parseFloat(booking_amount));
      return res.status(200).json({
        data: {
          discount_amount: discount,
          final_amount: Number((parseFloat(booking_amount) - discount).toFixed(2)),
        },
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async createPromo(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const {
        code, description, discount_type, discount_value,
        max_discount_amount, min_booking_amount, max_redemptions,
        max_redemptions_per_user, valid_until,
      } = req.body;

      const result = await query(
        `INSERT INTO promo_codes (id, code, description, discount_type, discount_value, max_discount_amount, min_booking_amount, max_redemptions, max_redemptions_per_user, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          uuidv4(), code.trim().toUpperCase(), description || null, discount_type, discount_value,
          max_discount_amount || null, min_booking_amount || null, max_redemptions || null,
          max_redemptions_per_user || 1, valid_until || null,
        ]
      );
      return res.status(201).json({ message: 'Promo code created', data: result.rows[0] });
    } catch (error: any) {
      if (error.code === '23505') return res.status(400).json({ error: 'A promo code with this code already exists' });
      return res.status(500).json({ error: error.message });
    }
  }

  static async listPromos(req: Request, res: Response) {
    try {
      if (!req.user || req.user.user_type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const result = await query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
      return res.status(200).json({ data: result.rows });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
