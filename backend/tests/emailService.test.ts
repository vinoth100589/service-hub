// emailService lazily builds and caches its transporter on first use, so
// each test needs a fresh module instance (jest.resetModules) to exercise a
// different config. mockConfig is captured once and mutated per test rather
// than recreated, so the same object reference is returned by the mocked
// module on every re-require.
const mockConfig = {
  email: {
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from: 'noreply@servicehub.test',
  },
};

jest.mock('@config/environment', () => ({ config: mockConfig }));
jest.mock('nodemailer');

function resetConfig() {
  mockConfig.email.smtp_host = '';
  mockConfig.email.smtp_port = 587;
  mockConfig.email.smtp_user = '';
  mockConfig.email.smtp_password = '';
}

function freshEmailService() {
  jest.resetModules();
  const nodemailer = require('nodemailer');
  const EmailService = require('../src/services/emailService').EmailService;
  return { EmailService, nodemailer };
}

beforeEach(() => {
  resetConfig();
});

describe('EmailService', () => {
  it('is not configured and logs instead of sending when SMTP credentials are missing', async () => {
    const { EmailService, nodemailer } = freshEmailService();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(EmailService.isConfigured()).toBe(false);
    const sent = await EmailService.send('user@example.com', 'Hi', '<p>hi</p>');

    expect(sent).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('not actually sent'));
    logSpy.mockRestore();
  });

  it('treats placeholder-looking credentials as unconfigured even when all fields are set', () => {
    mockConfig.email.smtp_host = 'smtp.gmail.com';
    mockConfig.email.smtp_user = 'your_email@gmail.com';
    mockConfig.email.smtp_password = 'your_app_password';
    const { EmailService, nodemailer } = freshEmailService();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(EmailService.isConfigured()).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('creates a transporter and sends when real-looking credentials are configured', async () => {
    mockConfig.email.smtp_host = 'smtp.sendgrid.net';
    mockConfig.email.smtp_user = 'apikey';
    mockConfig.email.smtp_password = 'SG.real-looking-secret-key-value';
    mockConfig.email.smtp_port = 587;

    const { EmailService, nodemailer } = freshEmailService();
    const sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    expect(EmailService.isConfigured()).toBe(true);
    const sent = await EmailService.send('user@example.com', 'Welcome', '<p>hi</p>');

    expect(sent).toBe(true);
    expect(sendMail).toHaveBeenCalledWith({
      from: mockConfig.email.from,
      to: 'user@example.com',
      subject: 'Welcome',
      html: '<p>hi</p>',
    });
  });

  it('uses secure:true only for port 465', () => {
    mockConfig.email.smtp_host = 'smtp.sendgrid.net';
    mockConfig.email.smtp_user = 'apikey';
    mockConfig.email.smtp_password = 'SG.real-looking-secret-key-value';
    mockConfig.email.smtp_port = 465;

    const { EmailService, nodemailer } = freshEmailService();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: jest.fn() });

    EmailService.isConfigured();

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );
  });

  it('never throws when the SMTP send itself fails', async () => {
    mockConfig.email.smtp_host = 'smtp.sendgrid.net';
    mockConfig.email.smtp_user = 'apikey';
    mockConfig.email.smtp_password = 'SG.real-looking-secret-key-value';

    const { EmailService, nodemailer } = freshEmailService();
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP connection refused'));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const sent = await EmailService.send('user@example.com', 'Welcome', '<p>hi</p>');

    expect(sent).toBe(false);
    errorSpy.mockRestore();
  });
});
