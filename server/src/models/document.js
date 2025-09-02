import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Document extends Model {}

Document.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(512), allowNull: false },
    source_uri: { type: DataTypes.TEXT, allowNull: true },
    raw_text: { type: DataTypes.TEXT, allowNull: false },
    meta_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  },
  { sequelize, modelName: 'Document', tableName: 'documents', underscored: true, timestamps: true }
);

export default Document;
