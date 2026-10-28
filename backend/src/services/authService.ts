import { UserRepository } from '../repositories/userRepository';
import { PublicUser, UserRole, toPublicUser } from '../types/user';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role ?? 'customer',
    });

    return { user: toPublicUser(user), tokens: this.issueTokens(user.id, user.email, user.role) };
  }

  async login(input: LoginInput): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: toPublicUser(user), tokens: this.issueTokens(user.id, user.email, user.role) };
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toPublicUser(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  private issueTokens(userId: string, email: string, role: UserRole): AuthTokens {
    return {
      accessToken: signAccessToken({ sub: userId, email, role }),
      refreshToken: signRefreshToken({ sub: userId }),
    };
  }
}
