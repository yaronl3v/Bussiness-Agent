import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Lead extends Model {}

Lead.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    conversation_id: { type: DataTypes.UUID, allowNull: true },
    lead_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('new', 'qualified', 'contacted', 'converted', 'rejected'), allowNull: false, defaultValue: 'new' }
  },
  { sequelize, modelName: 'Lead', tableName: 'leads', underscored: true, timestamps: true }
);

export default Lead;
