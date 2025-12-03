import { v4 as uuidv4 } from 'uuid';
import Agent from '../models/Agent';
import { GitHubService } from './githubService';
import { parseAgentMarkdown, ParsedAgent } from './agentParser';

export class AgentService {
  private githubService: GitHubService;

  constructor(githubToken?: string) {
    this.githubService = new GitHubService(githubToken);
  }

  async createAgentFromGitHub(repoUrl: string, filePath?: string): Promise<Agent> {
    const parsed = await this.githubService.fetchAgentFromGitHub(repoUrl, filePath);

    return await Agent.create({
      id: uuidv4(),
      name: parsed.name,
      role: parsed.role,
      description: parsed.description,
      tools: parsed.tools,
      content: parsed.content,
      sourceType: 'github',
      sourceUrl: repoUrl,
      metadata: parsed.metadata
    });
  }

  async importAgentsFromRepo(repoUrl: string, directory: string = 'agents'): Promise<Agent[]> {
    const parsedAgents = await this.githubService.fetchAgentsFromRepo(repoUrl, directory);

    const agents: Agent[] = [];
    for (const parsed of parsedAgents) {
      const agent = await Agent.create({
        id: uuidv4(),
        name: parsed.name,
        role: parsed.role,
        description: parsed.description,
        tools: parsed.tools,
        content: parsed.content,
        sourceType: 'github',
        sourceUrl: `${repoUrl}/${directory}`,
        metadata: parsed.metadata
      });
      agents.push(agent);
    }

    return agents;
  }

  async createAgentManually(data: {
    name: string;
    role: string;
    description: string;
    content: string;
    tools?: string[];
    avatarUrl?: string;
  }): Promise<Agent> {
    const parsed = parseAgentMarkdown(data.content);

    return await Agent.create({
      id: uuidv4(),
      name: data.name || parsed.name,
      role: data.role || parsed.role,
      description: data.description || parsed.description,
      tools: data.tools || parsed.tools,
      content: data.content,
      sourceType: 'manual',
      avatarUrl: data.avatarUrl,
      metadata: parsed.metadata
    });
  }

  async updateAgentMetrics(agentId: string, metrics: {
    issuesCompleted?: number;
    prsCompleted?: number;
    completionTime?: number;
  }): Promise<void> {
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (metrics.issuesCompleted) {
      agent.totalIssuesCompleted += metrics.issuesCompleted;
    }

    if (metrics.prsCompleted) {
      agent.totalPRsCompleted += metrics.prsCompleted;
    }

    if (metrics.completionTime) {
      const totalTasks = agent.totalIssuesCompleted + agent.totalPRsCompleted;
      agent.avgCompletionTime =
        (agent.avgCompletionTime * (totalTasks - 1) + metrics.completionTime) / totalTasks;
    }

    agent.velocity = this.calculateVelocity(agent);
    agent.efficiency = this.calculateEfficiency(agent);
    agent.currentCost = this.calculateDynamicCost(agent);

    await agent.save();
  }

  private calculateVelocity(agent: Agent): number {
    const tasksPerDay = (agent.totalIssuesCompleted + agent.totalPRsCompleted) /
                        Math.max(1, this.getDaysSinceCreation(agent.createdAt));
    return Math.min(100, tasksPerDay * 10);
  }

  private calculateEfficiency(agent: Agent): number {
    if (agent.avgCompletionTime === 0) return 50;
    const baseline = 24;
    const efficiency = Math.max(0, (baseline - agent.avgCompletionTime) / baseline * 100);
    return Math.min(100, efficiency);
  }

  private calculateDynamicCost(agent: Agent): number {
    const performanceMultiplier = (agent.velocity + agent.efficiency) / 100;
    const demandMultiplier = 1 + (agent.totalHires / 100);
    return agent.baseCost * performanceMultiplier * demandMultiplier;
  }

  private getDaysSinceCreation(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.max(1, diff / (1000 * 60 * 60 * 24));
  }

  async getLeaderboard(limit: number = 100, sortBy: 'velocity' | 'efficiency' | 'cost' = 'velocity'): Promise<Agent[]> {
    const order: [string, string][] = [[sortBy === 'cost' ? 'currentCost' : sortBy, 'DESC']];

    return await Agent.findAll({
      where: { isActive: true },
      order,
      limit
    });
  }

  async searchAgents(query: string, role?: string): Promise<Agent[]> {
    const where: any = {
      isActive: true
    };

    if (role) {
      where.role = role;
    }

    return await Agent.findAll({
      where,
      order: [['velocity', 'DESC']]
    });
  }
}
