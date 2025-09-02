import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Invite extends Model {}

Invite.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    inviter_user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'revoked', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Invite',
    tableName: 'invites',
    underscored: true,
    timestamps: true
  }
);

export default Invite;


