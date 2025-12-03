import Agent from '../models/Agent';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import User from '../models/User';
import { Op } from 'sequelize';

export interface LeaderboardEntry {
  rank: number;
  agent?: Agent;
  team?: any;
  score: number;
  change?: number;
}

export class LeaderboardService {
  async getAgentLeaderboard(options: {
    sortBy?: 'velocity' | 'efficiency' | 'cost' | 'hires' | 'tasks';
    limit?: number;
    role?: string;
  } = {}): Promise<LeaderboardEntry[]> {
    const {
      sortBy = 'velocity',
      limit = 100,
      role
    } = options;

    const where: any = { isActive: true };
    if (role) {
      where.role = role;
    }

    let orderField: string;
    switch (sortBy) {
      case 'efficiency':
        orderField = 'efficiency';
        break;
      case 'cost':
        orderField = 'currentCost';
        break;
      case 'hires':
        orderField = 'totalHires';
        break;
      case 'tasks':
        orderField = '(total_issues_completed + total_p_rs_completed)' as any;
        break;
      default:
        orderField = 'velocity';
    }

    const agents = await Agent.findAll({
      where,
      order: [[orderField, 'DESC']],
      limit
    });

    return agents.map((agent, index) => ({
      rank: index + 1,
      agent,
      score: this.getAgentScore(agent, sortBy)
    }));
  }

  async getTeamLeaderboard(options: {
    sortBy?: 'value' | 'roi' | 'performance';
    limit?: number;
  } = {}): Promise<any[]> {
    const {
      sortBy = 'value',
      limit = 50
    } = options;

    const teams = await Team.findAll({
      where: { isActive: true },
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
      ],
      limit: limit * 2
    });

    const teamsWithStats = teams.map(team => {
      const members = (team as any).members || [];
      const totalMembers = members.length;

      if (totalMembers === 0) {
        return {
          team,
          currentValue: 0,
          roi: 0,
          avgPerformance: 0
        };
      }

      const currentValue = members.reduce((sum: number, m: any) =>
        sum + (m.agent?.currentCost || 0), 0);

      const totalVelocity = members.reduce((sum: number, m: any) =>
        sum + (m.agent?.velocity || 0), 0);

      const totalEfficiency = members.reduce((sum: number, m: any) =>
        sum + (m.agent?.efficiency || 0), 0);

      const avgPerformance = (totalVelocity + totalEfficiency) / (totalMembers * 2);

      const roi = team.totalCost > 0
        ? ((currentValue - team.totalCost) / team.totalCost * 100)
        : 0;

      return {
        team,
        currentValue,
        roi,
        avgPerformance,
        totalCost: team.totalCost
      };
    });

    let sortedTeams;
    switch (sortBy) {
      case 'roi':
        sortedTeams = teamsWithStats.sort((a, b) => b.roi - a.roi);
        break;
      case 'performance':
        sortedTeams = teamsWithStats.sort((a, b) => b.avgPerformance - a.avgPerformance);
        break;
      default:
        sortedTeams = teamsWithStats.sort((a, b) => b.currentValue - a.currentValue);
    }

    return sortedTeams.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      team: item.team,
      currentValue: item.currentValue,
      totalCost: item.totalCost,
      roi: Math.round(item.roi * 100) / 100,
      avgPerformance: Math.round(item.avgPerformance * 100) / 100
    }));
  }

  async getRoleLeaderboard(role: string, limit: number = 20): Promise<LeaderboardEntry[]> {
    return this.getAgentLeaderboard({ role, limit });
  }

  async getMostHiredAgents(limit: number = 10): Promise<LeaderboardEntry[]> {
    return this.getAgentLeaderboard({ sortBy: 'hires', limit });
  }

  async getMostActiveAgents(days: number = 7, limit: number = 10): Promise<Agent[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const agents = await Agent.findAll({
      where: {
        isActive: true,
        updatedAt: {
          [Op.gte]: startDate
        }
      },
      order: [
        [Agent.sequelize!.literal('(total_issues_completed + total_p_rs_completed)'), 'DESC']
      ],
      limit
    });

    return agents;
  }

  async getRisingStars(limit: number = 10): Promise<Agent[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const agents = await Agent.findAll({
      where: {
        isActive: true,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [
        ['velocity', 'DESC'],
        ['efficiency', 'DESC']
      ],
      limit
    });

    return agents;
  }

  async getBestValueAgents(limit: number = 10): Promise<Agent[]> {
    const agents = await Agent.findAll({
      where: { isActive: true },
      order: [
        [Agent.sequelize!.literal('(velocity + efficiency) / current_cost'), 'DESC']
      ],
      limit
    });

    return agents;
  }

  async getAllLeaderboards(): Promise<any> {
    const [
      topVelocity,
      topEfficiency,
      mostHired,
      risingStars,
      bestValue,
      topTeams
    ] = await Promise.all([
      this.getAgentLeaderboard({ sortBy: 'velocity', limit: 10 }),
      this.getAgentLeaderboard({ sortBy: 'efficiency', limit: 10 }),
      this.getMostHiredAgents(10),
      this.getRisingStars(10),
      this.getBestValueAgents(10),
      this.getTeamLeaderboard({ limit: 10 })
    ]);

    return {
      topVelocity,
      topEfficiency,
      mostHired,
      risingStars,
      bestValue,
      topTeams
    };
  }

  private getAgentScore(agent: Agent, sortBy: string): number {
    switch (sortBy) {
      case 'efficiency':
        return agent.efficiency;
      case 'cost':
        return agent.currentCost;
      case 'hires':
        return agent.totalHires;
      case 'tasks':
        return agent.totalIssuesCompleted + agent.totalPRsCompleted;
      default:
        return agent.velocity;
    }
  }

  async getAgentRank(agentId: string, sortBy: 'velocity' | 'efficiency' = 'velocity'): Promise<number> {
    const field = sortBy === 'efficiency' ? 'efficiency' : 'velocity';

    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const fieldValue = sortBy === 'efficiency' ? agent.efficiency : agent.velocity;

    const rank = await Agent.count({
      where: {
        isActive: true,
        [field]: {
          [Op.gt]: fieldValue
        }
      }
    });

    return rank + 1;
  }
}
