import { Vendor, Agent, OrgUser, Lead } from '../models/index.js';

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
    if (!agent) return { routed: false, reason: 'agent_not_found' };
    const membership = await OrgUser.findOne({ where: { user_id: userId, org_id: agent.org_id } });
    if (!membership) return { routed: false, reason: 'forbidden' };

    const lead = await Lead.findByPk(leadId);
    if (!lead || lead.agent_id !== agentId) return { routed: false, reason: 'lead_not_found' };

    const vendors = await Vendor.findAll({ where: { agent_id: agentId, status: 'active' }, order: [['created_at', 'ASC']] });
    if (!vendors.length) return { routed: false, reason: 'no_active_vendors' };

    const leadData = lead.lead_jsonb || {};

    // Simple criteria-based selection: vendors may include vendor_jsonb.criteria = [{ field, equals }] (optional)
    let best = null;
    let bestScore = -1;
    for (const v of vendors) {
      const cfg = v.vendor_jsonb || {};
      const criteria = Array.isArray(cfg.criteria) ? cfg.criteria : [];
      if (!criteria.length) {
        if (best === null) { best = v; bestScore = 0; }
        continue;
      }
      let score = 0;
      for (const c of criteria) {
        const field = c.field;
        const expected = c.equals;
        if (!field) continue;
        const value = leadData[field];
        if (Array.isArray(expected)) {
          if (expected.includes(value)) score += 1;
        } else if (expected !== undefined) {
          if (value === expected) score += 1;
        }
      }
      if (score > bestScore) { best = v; bestScore = score; }
    }

    const selected = best || vendors[0];
    await Lead.update({ status: 'contacted' }, { where: { id: leadId } });
    return { routed: true, vendorId: selected.id, vendor: selected.vendor_jsonb || {}, leadId };
  }

  static async selectVendor(agentId, leadJsonb) {
    const vendors = await Vendor.findAll({ where: { agent_id: agentId, status: 'active' }, order: [['created_at', 'ASC']] });
    if (!vendors.length) return null;
    const leadData = leadJsonb || {};
    let best = null;
    let bestScore = -1;
    for (const v of vendors) {
      const cfg = v.vendor_jsonb || {};
      const criteria = Array.isArray(cfg.criteria) ? cfg.criteria : [];
      if (!criteria.length) {
        if (best === null) { best = v; bestScore = 0; }
        continue;
      }
      let score = 0;
      for (const c of criteria) {
        const field = c.field;
        const expected = c.equals;
        if (!field) continue;
        const value = leadData[field];
        if (Array.isArray(expected)) {
          if (expected.includes(value)) score += 1;
        } else if (expected !== undefined) {
          if (value === expected) score += 1;
        }
      }
      if (score > bestScore) { best = v; bestScore = score; }
    }
    return best ? best.dataValues : null;
  }
}

export default VendorService;
