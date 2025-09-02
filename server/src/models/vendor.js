import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Vendor extends Model {}

Vendor.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    vendor_jsonb: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' }
  },
  { sequelize, modelName: 'Vendor', tableName: 'vendors', underscored: true, timestamps: true }
);

export default Vendor;
