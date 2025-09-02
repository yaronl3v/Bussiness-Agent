import { ApiKey } from '../models/index.js';

export class ApiKeysService {
  static async list(agentId) {
    const keys = await ApiKey.findAll({ where: { agent_id: agentId } });
    return keys.map(k => k.dataValues);
  }

  static async create(agentId, { provider, key_ref }) {
    const key = await ApiKey.create({ agent_id: agentId, provider, key_ref });
    return key.dataValues;
  }

  static async remove(id) {
    await ApiKey.destroy({ where: { id } });
    return true;
  }
}

export default ApiKeysService;
