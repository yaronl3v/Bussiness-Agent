import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Webhook extends Model {}

Webhook.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    config_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  },
  { sequelize, modelName: 'Webhook', tableName: 'webhooks', underscored: true, timestamps: true }
);

export default Webhook;
