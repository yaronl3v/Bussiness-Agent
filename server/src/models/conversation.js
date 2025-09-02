import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Conversation extends Model {}

Conversation.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    client_id: { type: DataTypes.STRING(255), allowNull: false },
    channel: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'inapp' },
    meta_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  },
  { sequelize, modelName: 'Conversation', tableName: 'conversations', underscored: true, timestamps: true }
);

export default Conversation;
