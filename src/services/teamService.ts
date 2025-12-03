import { v4 as uuidv4 } from 'uuid';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import Agent from '../models/Agent';
import User from '../models/User';

export class TeamService {
  async createTeam(userId: string, name: string, description?: string): Promise<Team> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await Team.create({
      id: uuidv4(),
      userId,
      name,
      description,
      totalCost: 0
    });
  }

  async addAgentToTeam(teamId: string, agentId: string, position: string = 'member'): Promise<TeamMember> {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const user = await User.findByPk(team.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits < agent.currentCost) {
      throw new Error('Insufficient credits to hire this agent');
    }

    const existingMember = await TeamMember.findOne({
      where: { teamId, agentId }
    });

    if (existingMember) {
      throw new Error('Agent already on this team');
    }

    user.credits -= agent.currentCost;
    await user.save();

    agent.totalHires += 1;
    const oldCost = agent.currentCost;
    agent.currentCost = agent.baseCost * (1 + (agent.totalHires / 100));
    await agent.save();

    team.totalCost += oldCost;
    await team.save();

    const teamMember = await TeamMember.create({
      id: uuidv4(),
      teamId,
      agentId,
      position,
      costAtHire: oldCost,
      joinedAt: new Date()
    });

    return teamMember;
  }

  async removeAgentFromTeam(teamId: string, agentId: string): Promise<void> {
    const teamMember = await TeamMember.findOne({
      where: { teamId, agentId }
    });

    if (!teamMember) {
      throw new Error('Agent not on this team');
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const agent = await Agent.findByPk(agentId);
    if (agent) {
      agent.totalHires = Math.max(0, agent.totalHires - 1);
      await agent.save();
    }

    team.totalCost = Math.max(0, team.totalCost - teamMember.costAtHire);
    await team.save();

    await teamMember.destroy();
  }

  async getTeamWithMembers(teamId: string): Promise<any> {
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'displayName', 'avatarUrl']
        },
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: Agent,
              as: 'agent'
            }
          ]
        }
      ]
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await Team.findAll({
      where: { userId, isActive: true },
      include: [
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: Agent,
              as: 'agent',
              attributes: ['id', 'name', 'role', 'avatarUrl', 'velocity', 'efficiency']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async getTeamStats(teamId: string): Promise<any> {
    const team = await this.getTeamWithMembers(teamId);

    const members = team.members || [];
    const totalMembers = members.length;

    if (totalMembers === 0) {
      return {
        totalMembers: 0,
        avgVelocity: 0,
        avgEfficiency: 0,
        totalCost: team.totalCost,
        estimatedValue: 0
      };
    }

    const totalVelocity = members.reduce((sum: number, m: any) => sum + (m.agent?.velocity || 0), 0);
    const totalEfficiency = members.reduce((sum: number, m: any) => sum + (m.agent?.efficiency || 0), 0);
    const currentValue = members.reduce((sum: number, m: any) => sum + (m.agent?.currentCost || 0), 0);

    return {
      totalMembers,
      avgVelocity: totalVelocity / totalMembers,
      avgEfficiency: totalEfficiency / totalMembers,
      totalCost: team.totalCost,
      currentValue,
      roi: ((currentValue - team.totalCost) / team.totalCost * 100).toFixed(2)
    };
  }

  async getRecommendedAgents(teamId: string, limit: number = 5): Promise<Agent[]> {
    const team = await this.getTeamWithMembers(teamId);

    const existingRoles = new Set(
      team.members.map((m: any) => m.agent?.role).filter(Boolean)
    );

    const agents = await Agent.findAll({
      where: {
        isActive: true
      },
      order: [
        ['velocity', 'DESC'],
        ['efficiency', 'DESC']
      ],
      limit: limit * 3
    });

    const recommendations = agents
      .filter(agent => !existingRoles.has(agent.role))
      .slice(0, limit);

    return recommendations;
  }

  async deleteTeam(teamId: string): Promise<void> {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    await TeamMember.destroy({ where: { teamId } });

    team.isActive = false;
    await team.save();
  }
}
