import { Agent, OrgUser } from '../models/index.js';

export class AgentService {
  static async listForOrg(userId, orgId) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return [];
    const agents = await Agent.findAll({ where: { org_id: orgId } });
    return agents.map(a => a.dataValues);
  }

  static async createForOrg(userId, orgId, { name, welcome_message, special_instructions, modules_jsonb }) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return null;
    const agent = await Agent.create({
      org_id: orgId,
      user_id: userId,
      name,
      status: 'disabled',
      welcome_message: welcome_message || null,
      special_instructions: special_instructions || null,
      lead_form_schema_jsonb: {},
      dynamic_info_schema_jsonb: {},
      modules_jsonb: modules_jsonb || {}
    });
    return agent.dataValues;
  }

  static async getByIdForOrg(userId, orgId, agentId) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return null;
    const agent = await Agent.findOne({ where: { id: agentId, org_id: orgId } });
    return agent ? agent.dataValues : null;
  }

  static async updateForOrg(userId, orgId, agentId, updates) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return null;
    await Agent.update(updates, { where: { id: agentId, org_id: orgId } });
    const agent = await Agent.findOne({ where: { id: agentId, org_id: orgId } });
    return agent ? agent.dataValues : null;
  }

  static async removeForOrg(userId, orgId, agentId) {
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: orgId } });
    if (!membership) return false;
    await Agent.destroy({ where: { id: agentId, org_id: orgId } });
    return true;
  }

  static async activate(userId, orgId, agentId) {
    return this.updateForOrg(userId, orgId, agentId, { status: 'active' });
  }
}

export default AgentService;
