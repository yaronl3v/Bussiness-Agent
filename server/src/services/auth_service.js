import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Organization, OrgUser, Invite } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  static async register({ email, password, organizationName, inviteToken }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: passwordHash, role: 'user', profile_jsonb: {} });

    let organizationId = null;
    if (inviteToken) {
      const invite = await Invite.findOne({ where: { token: inviteToken, status: 'pending' } });
      if (invite) {
        await OrgUser.create({ org_id: invite.org_id, user_id: user.id, role: 'member' });
        invite.status = 'accepted';
        await invite.save();
        organizationId = invite.org_id;
      }
    } else if (organizationName) {
      const org = await Organization.create({ name: organizationName, owner_user_id: user.id, settings_jsonb: {} });
      await OrgUser.create({ org_id: org.id, user_id: user.id, role: 'owner' });
      organizationId = org.id;
    }

    const token = this.issueToken({ userId: user.id, role: user.role });
    return { user: user.dataValues, token, organizationId };
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
