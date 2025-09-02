// Model associations and exports
// This file will define relationships between models

import sequelize from '../db/sequelize.js';

import User from './user.js';
import Organization from './organization.js';
import OrgUser from './org_user.js';
import Invite from './invite.js';
import Agent from './agent.js';
import Document from './document.js';
import Chunk from './chunk.js';
import Conversation from './conversation.js';
import Message from './message.js';
import Lead from './lead.js';
import Vendor from './vendor.js';
import ApiKey from './api_key.js';
import Webhook from './webhook.js';

// Define associations here
export const initializeAssociations = () => {
  // Users and Organizations through OrgUser
  Organization.hasMany(OrgUser, { foreignKey: 'org_id', as: 'orgUsers' });
  OrgUser.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

  User.hasMany(OrgUser, { foreignKey: 'user_id', as: 'orgUsers' });
  OrgUser.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Organization owner
  Organization.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' });

  // Organization invites
  Organization.hasMany(Invite, { foreignKey: 'org_id', as: 'invites' });
  Invite.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });
  Invite.belongsTo(User, { foreignKey: 'inviter_user_id', as: 'inviter' });

  // Agents
  Organization.hasMany(Agent, { foreignKey: 'org_id', as: 'agents' });
  Agent.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });
  Agent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Documents and Chunks
  Agent.hasMany(Document, { foreignKey: 'agent_id', as: 'documents' });
  Document.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

  Document.hasMany(Chunk, { foreignKey: 'document_id', as: 'chunks' });
  Chunk.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });
  Chunk.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

  // Conversations and Messages
  Agent.hasMany(Conversation, { foreignKey: 'agent_id', as: 'conversations' });
  Conversation.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

  Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
  Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

  // Leads & Vendors
  Agent.hasMany(Lead, { foreignKey: 'agent_id', as: 'leads' });
  Lead.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
  Lead.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

  Agent.hasMany(Vendor, { foreignKey: 'agent_id', as: 'vendors' });
  Vendor.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

  // ApiKeys & Webhooks
  Agent.hasMany(ApiKey, { foreignKey: 'agent_id', as: 'apiKeys' });
  ApiKey.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

  Agent.hasMany(Webhook, { foreignKey: 'agent_id', as: 'webhooks' });
  Webhook.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
};

// Export all models
export {
  sequelize,
  User,
  Organization,
  OrgUser,
  Invite,
  Agent,
  Document,
  Chunk,
  Conversation,
  Message,
  Lead,
  Vendor,
  ApiKey,
  Webhook
};

// Initialize associations when this module is imported
initializeAssociations();
