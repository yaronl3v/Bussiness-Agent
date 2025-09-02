import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Message extends Model {}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversation_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM('user', 'assistant', 'system'), allowNull: false },
    content_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    citations_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }
  },
  { sequelize, modelName: 'Message', tableName: 'messages', underscored: true, timestamps: true }
);

export default Message;
