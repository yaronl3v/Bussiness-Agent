import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Chunk extends Model {}

Chunk.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    document_id: { type: DataTypes.UUID, allowNull: false },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    position_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    // embedding is vector(1536) in Postgres; keep JS-side nullable any
    embedding: { type: DataTypes.JSONB, allowNull: true }
  },
  { sequelize, modelName: 'Chunk', tableName: 'chunks', underscored: true, timestamps: true }
);

export default Chunk;
