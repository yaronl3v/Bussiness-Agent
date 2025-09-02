import { Vendor, Agent, OrgUser } from '../models/index.js';

export class VendorService {
  static async listForAgent(userId, agentId) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) return [];
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return [];
    const vendors = await Vendor.findAll({ where: { agent_id: agentId }, order: [['created_at', 'DESC']] });
    return vendors.map(v => v.dataValues);
  }

  static async create(userId, agentId, vendor_jsonb) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) return null;
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return null;
    const vendor = await Vendor.create({ agent_id: agentId, vendor_jsonb, status: 'active' });
    return vendor.dataValues;
  }

  static async update(userId, id, updates) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) return null;
    const agent = await Agent.findByPk(vendor.agent_id);
    if (!agent) return null;
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return null;
    await Vendor.update(updates, { where: { id } });
    await vendor.reload();
    return vendor.dataValues;
  }

  static async remove(userId, id) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) return false;
    const agent = await Agent.findByPk(vendor.agent_id);
    if (!agent) return false;
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return false;
    await Vendor.destroy({ where: { id } });
    return true;
  }

  static async routeLead({ userId, agentId, leadId }) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) return { routed: false };
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return { routed: false };
    // placeholder stub for routing logic
    return { routed: true, agentId, leadId };
  }
}

export default VendorService;
