import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  static async register({ email, password }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: passwordHash, role: 'user', profile_jsonb: {} });
    const token = this.issueToken({ userId: user.id, role: user.role });
    return { user: user.dataValues, token };
  }

  static async login({ email, password }) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const token = this.issueToken({ userId: user.id, role: user.role });
    return { user: user.dataValues, token };
  }

  static issueToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

export default AuthService;
