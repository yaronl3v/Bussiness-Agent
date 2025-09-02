import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class OrgUser extends Model {}

OrgUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('member', 'owner', 'admin'),
      allowNull: false,
      defaultValue: 'member'
    }
  },
  {
    sequelize,
    modelName: 'OrgUser',
    tableName: 'org_users',
    underscored: true,
    timestamps: true
  }
);

export default OrgUser;


