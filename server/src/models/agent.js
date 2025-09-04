import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

export class Agent extends Model {}

Agent.init(
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
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      allowNull: false,
      defaultValue: 'disabled'
    },
    welcome_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dynamic_info_schema_natural_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lead_schema_natural_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lead_form_schema_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    dynamic_info_schema_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    modules_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
    ,
    post_collection_information_text: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Agent',
    tableName: 'agents',
    underscored: true,
    timestamps: true
  }
);

export default Agent;


