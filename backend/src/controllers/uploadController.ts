import { Request, Response } from 'express';
import { query } from '@config/database';
import { config } from '@config/environment';

function publicUrlFor(filename: string): string {
  return `${config.api_base_url}/uploads/${filename}`;
}

export class UploadController {
  static async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      if (!req.file) return res.status(400).json({ error: 'No image file provided' });

      const url = publicUrlFor(req.file.filename);
      const result = await query(
        `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING avatar_url`,
        [url, req.user.id]
      );

      return res.status(200).json({ message: 'Avatar updated', data: { avatar_url: result.rows[0].avatar_url } });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Appends one or more images to a service's gallery (owning provider only)
  static async uploadServiceImages(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const files = (req.files as Express.Multer.File[]) || [];
      if (!files.length) return res.status(400).json({ error: 'No image files provided' });

      const { serviceId } = req.params;
      const serviceCheck = await query(
        `SELECT s.images FROM services s
         JOIN providers p ON s.provider_id = p.id
         WHERE s.id = $1 AND p.user_id = $2`,
        [serviceId, req.user.id]
      );
      if (!serviceCheck.rows.length) {
        return res.status(404).json({ error: 'Service not found or not owned by you' });
      }

      const newUrls = files.map((f) => publicUrlFor(f.filename));
      const existingImages: string[] = serviceCheck.rows[0].images || [];
      const updatedImages = [...existingImages, ...newUrls];

      const result = await query(
        `UPDATE services SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images`,
        [updatedImages, serviceId]
      );

      return res.status(200).json({ message: 'Images uploaded', data: { images: result.rows[0].images } });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
