import { Lead, OrgUser, Agent } from '../models/index.js';

export class LeadService {
  static async listForAgent(userId, agentId) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) return [];
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return [];
    const leads = await Lead.findAll({ where: { agent_id: agentId }, order: [['created_at', 'DESC']] });
    return leads.map(l => l.dataValues);
  }

  static async updateStatus(userId, leadId, status) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) return null;
    const agent = await Agent.findByPk(lead.agent_id);
    if (!agent) return null;
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return null;
    await Lead.update({ status }, { where: { id: leadId } });
    await lead.reload();
    return lead ? lead.dataValues : null;
  }
}

export default LeadService;
