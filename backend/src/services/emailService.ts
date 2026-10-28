import nodemailer, { Transporter } from 'nodemailer';
import { config } from '@config/environment';

let transporter: Transporter | null = null;
let attemptedInit = false;

// Placeholder scaffolding text ("your_email@gmail.com", "your_app_password")
// is easy to leave in .env by accident — it's non-empty, so the plain
// presence check below would treat it as configured and attempt a real (and
// failing) SMTP connection instead of using the dev-mode fallback.
const PLACEHOLDER_MARKERS = ['your_', 'placeholder', 'changeme', 'example.com'];
function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

// Lazily built so a missing SMTP config doesn't crash startup — email
// sending just silently falls back to a dev-mode log until credentials
// are supplied.
function getTransporter(): Transporter | null {
  if (attemptedInit) return transporter;
  attemptedInit = true;

  if (!config.email.smtp_host || !config.email.smtp_user || !config.email.smtp_password) {
    return null;
  }
  if (looksLikePlaceholder(config.email.smtp_user) || looksLikePlaceholder(config.email.smtp_password)) {
    console.warn('[email] SMTP credentials look like placeholders — using dev-mode log fallback.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.smtp_host,
    port: config.email.smtp_port,
    secure: config.email.smtp_port === 465,
    auth: {
      user: config.email.smtp_user,
      pass: config.email.smtp_password,
    },
  });
  return transporter;
}

export const EmailService = {
  isConfigured(): boolean {
    return getTransporter() !== null;
  },

  // Never throws — a failed/unconfigured email send should not fail the
  // request that triggered it (registration, password reset, etc).
  async send(to: string, subject: string, html: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      console.log(`[email:dev] to=${to} subject="${subject}" (SMTP not configured — not actually sent)`);
      return false;
    }
    try {
      await t.sendMail({ from: config.email.from, to, subject, html });
      return true;
    } catch (error: any) {
      console.error(`[email] send failed to=${to}:`, error.message);
      return false;
    }
  },
};
