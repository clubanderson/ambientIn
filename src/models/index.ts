import Agent from './Agent';
import User from './User';
import Team from './Team';
import TeamMember from './TeamMember';
import Post from './Post';
import Metric from './Metric';

User.hasMany(Team, { foreignKey: 'userId', as: 'teams' });
Team.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

Agent.hasMany(TeamMember, { foreignKey: 'agentId', as: 'teamMemberships' });
TeamMember.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

Agent.hasMany(Post, { foreignKey: 'agentId', as: 'posts' });
Post.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Agent.hasMany(Metric, { foreignKey: 'agentId', as: 'metrics' });
Metric.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

export {
  Agent,
  User,
  Team,
  TeamMember,
  Post,
  Metric
};
