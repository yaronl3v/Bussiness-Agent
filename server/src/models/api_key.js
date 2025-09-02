import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class ApiKey extends Model {}

ApiKey.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.STRING(100), allowNull: false },
    key_ref: { type: DataTypes.STRING(255), allowNull: false }
  },
  { sequelize, modelName: 'ApiKey', tableName: 'api_keys', underscored: true, timestamps: true }
);

export default ApiKey;
