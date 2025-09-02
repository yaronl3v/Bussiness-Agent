import { Organization, OrgUser, User } from '../models/index.js';

export class OrgService {
  static async listForUser(userId) {
    const memberships = await OrgUser.findAll({ where: { user_id: userId } });
    const orgIds = memberships.map(m => m.org_id);
    if (orgIds.length === 0) return [];
    const orgs = await Organization.findAll({ where: { id: orgIds } });
    return orgs.map(o => o.dataValues);
  }

  static async createForUser(userId, { name }) {
    const org = await Organization.create({ name, owner_user_id: userId, settings_jsonb: {} });
    await OrgUser.create({ org_id: org.id, user_id: userId, role: 'owner' });
    return org.dataValues;
  }

  static async getByIdForUser(userId, orgId) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return null;
    const org = await Organization.findByPk(orgId);
    return org ? org.dataValues : null;
  }

  static async updateForUser(userId, orgId, { name, settings_jsonb }) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return null;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (settings_jsonb !== undefined) updates.settings_jsonb = settings_jsonb;
    await Organization.update(updates, { where: { id: orgId } });
    const org = await Organization.findByPk(orgId);
    return org ? org.dataValues : null;
  }

  static async deleteForUser(userId, orgId) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return false;
    await Organization.destroy({ where: { id: orgId } });
    return true;
  }
}

export default OrgService;
