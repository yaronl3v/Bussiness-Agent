import { Invite, OrgUser } from '../models/index.js';
import { randomBytes } from 'crypto';

export class InviteService {
  static async create(orgId, email, inviterUserId) {
    const token = randomBytes(16).toString('hex');
    const invite = await Invite.create({ org_id: orgId, email, inviter_user_id: inviterUserId, token, status: 'pending' });
    return invite.dataValues;
  }

  static async accept(token, userId) {
    const invite = await Invite.findOne({ where: { token, status: 'pending' } });
    if (!invite) return null;
    await OrgUser.create({ org_id: invite.org_id, user_id: userId, role: 'member' });
    invite.status = 'accepted';
    await invite.save();
    return invite.dataValues;
  }
}

export default InviteService;
