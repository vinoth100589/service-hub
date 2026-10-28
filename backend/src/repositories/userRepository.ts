import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { User, UserRole } from '../types/user';

export interface NewUser {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}

export class InMemoryUserRepository implements UserRepository {
  private usersByEmail = new Map<string, User>();
  private usersById = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async create(input: NewUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      role: input.role,
      createdAt: new Date(),
    };
    this.usersByEmail.set(user.email, user);
    this.usersById.set(user.id, user);
    return user;
  }
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async create(input: NewUser): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, full_name, role, created_at`,
      [input.email.toLowerCase(), input.passwordHash, input.fullName, input.role],
    );
    return mapRow(result.rows[0]);
  }
}

function mapRow(row: {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
}): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}
