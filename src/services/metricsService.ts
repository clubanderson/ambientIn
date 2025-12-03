import { v4 as uuidv4 } from 'uuid';
import Metric from '../models/Metric';
import Agent from '../models/Agent';
import { BettyBot } from './betty';
import { Op } from 'sequelize';

export class MetricsService {
  private bettyBot: BettyBot;

  constructor() {
    this.bettyBot = new BettyBot();
  }

  async recordMetric(data: {
    agentId: string;
    metricType: 'issue' | 'pr' | 'task';
    completionTime: number;
    difficulty?: number;
    success?: boolean;
    metadata?: Record<string, any>;
  }): Promise<Metric> {
    const metric = await Metric.create({
      id: uuidv4(),
      agentId: data.agentId,
      metricType: data.metricType,
      completionTime: data.completionTime,
      difficulty: data.difficulty || 5,
      success: data.success !== false,
      metadata: data.metadata || {},
      recordedAt: new Date()
    });

    await this.updateAgentMetrics(data.agentId);

    return metric;
  }

  async updateAgentMetrics(agentId: string): Promise<void> {
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const oldCost = agent.currentCost;
    const oldTotalTasks = agent.totalIssuesCompleted + agent.totalPRsCompleted;

    const issueMetrics = await Metric.count({
      where: {
        agentId,
        metricType: 'issue',
        success: true
      }
    });

    const prMetrics = await Metric.count({
      where: {
        agentId,
        metricType: 'pr',
        success: true
      }
    });

    const avgTime = await Metric.findOne({
      where: { agentId, success: true },
      attributes: [
        [Metric.sequelize!.fn('AVG', Metric.sequelize!.col('completionTime')), 'avgTime']
      ],
      raw: true
    });

    agent.totalIssuesCompleted = issueMetrics;
    agent.totalPRsCompleted = prMetrics;
    agent.avgCompletionTime = (avgTime as any)?.avgTime || 0;

    agent.velocity = this.calculateVelocity(agent);
    agent.efficiency = this.calculateEfficiency(agent);
    agent.currentCost = this.calculateDynamicCost(agent);

    await agent.save();

    await this.bettyBot.checkAndPostUpdates(agent, {
      cost: oldCost,
      totalTasks: oldTotalTasks
    });
  }

  private calculateVelocity(agent: Agent): number {
    const totalTasks = agent.totalIssuesCompleted + agent.totalPRsCompleted;
    if (totalTasks === 0) return 50;

    const daysSinceCreation = this.getDaysSinceCreation(agent.createdAt);
    const tasksPerDay = totalTasks / daysSinceCreation;

    const velocityScore = Math.min(100, 50 + tasksPerDay * 10);
    return Math.round(velocityScore * 10) / 10;
  }

  private calculateEfficiency(agent: Agent): number {
    if (agent.avgCompletionTime === 0) return 50;

    const baselineHours = 24;
    const efficiency = Math.max(0, Math.min(100,
      100 - (agent.avgCompletionTime / baselineHours * 50)
    ));

    return Math.round(efficiency * 10) / 10;
  }

  private calculateDynamicCost(agent: Agent): number {
    const performanceScore = (agent.velocity + agent.efficiency) / 2;
    const performanceMultiplier = performanceScore / 50;

    const demandMultiplier = 1 + (agent.totalHires / 100);

    const newCost = agent.baseCost * performanceMultiplier * demandMultiplier;

    return Math.round(newCost * 100) / 100;
  }

  private getDaysSinceCreation(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.max(1, diff / (1000 * 60 * 60 * 24));
  }

  async getAgentMetrics(agentId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await Metric.findAll({
      where: {
        agentId,
        recordedAt: {
          [Op.gte]: startDate
        }
      },
      order: [['recordedAt', 'ASC']]
    });

    const byType = {
      issue: metrics.filter(m => m.metricType === 'issue'),
      pr: metrics.filter(m => m.metricType === 'pr'),
      task: metrics.filter(m => m.metricType === 'task')
    };

    const avgCompletionTimes = {
      issue: this.calculateAverage(byType.issue.map(m => m.completionTime)),
      pr: this.calculateAverage(byType.pr.map(m => m.completionTime)),
      task: this.calculateAverage(byType.task.map(m => m.completionTime))
    };

    const successRates = {
      issue: this.calculateSuccessRate(byType.issue),
      pr: this.calculateSuccessRate(byType.pr),
      task: this.calculateSuccessRate(byType.task)
    };

    return {
      totalMetrics: metrics.length,
      byType: {
        issues: byType.issue.length,
        prs: byType.pr.length,
        tasks: byType.task.length
      },
      avgCompletionTimes,
      successRates,
      recentMetrics: metrics.slice(-10)
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  private calculateSuccessRate(metrics: Metric[]): number {
    if (metrics.length === 0) return 100;
    const successful = metrics.filter(m => m.success).length;
    return Math.round((successful / metrics.length) * 100);
  }

  async getMetricsTrends(agentId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await Metric.findAll({
      where: {
        agentId,
        recordedAt: {
          [Op.gte]: startDate
        }
      },
      order: [['recordedAt', 'ASC']]
    });

    const dailyData: Map<string, any> = new Map();

    metrics.forEach(metric => {
      const dateKey = metric.recordedAt.toISOString().split('T')[0];

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          count: 0,
          totalTime: 0,
          successes: 0
        });
      }

      const day = dailyData.get(dateKey)!;
      day.count += 1;
      day.totalTime += metric.completionTime;
      if (metric.success) day.successes += 1;
    });

    return Array.from(dailyData.values()).map(day => ({
      date: day.date,
      count: day.count,
      avgCompletionTime: Math.round((day.totalTime / day.count) * 100) / 100,
      successRate: Math.round((day.successes / day.count) * 100)
    }));
  }
}
