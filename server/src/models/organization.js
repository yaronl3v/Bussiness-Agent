import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Organization extends Model {}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    owner_user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    settings_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    underscored: true,
    timestamps: true
  }
);

export default Organization;


