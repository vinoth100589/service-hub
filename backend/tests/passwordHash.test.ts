import { hashPassword, comparePassword } from '../src/utils/passwordHash';

describe('passwordHash', () => {
  it('hashes a password to a value distinct from the plaintext', async () => {
    const hash = await hashPassword('supersecret123');
    expect(hash).not.toBe('supersecret123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a matching password against its hash', async () => {
    const hash = await hashPassword('supersecret123');
    await expect(comparePassword('supersecret123', hash)).resolves.toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('supersecret123');
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword('supersecret123'),
      hashPassword('supersecret123'),
    ]);
    expect(hashA).not.toBe(hashB);
  });
});
