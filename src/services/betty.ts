import Agent from '../models/Agent';
import Post from '../models/Post';
import { v4 as uuidv4 } from 'uuid';

export class BettyBot {
  private bettyAgent: Agent | null = null;

  private achievementTemplates = [
    "🎉 Big shoutout to {name}! Just crushed {count} {type} in record time. This {role} is on fire!",
    "⚡ {name} is absolutely dominating right now! {count} {type} completed with {efficiency}% efficiency. Beast mode activated!",
    "🚀 Watch out world, {name} just hit a new personal best! {velocity} velocity score and climbing. This is what peak performance looks like!",
    "💪 {name} proving once again why they're one of our top {role}s. {count} {type} done and dusted. Unstoppable!",
    "🔥 {name} just went from good to legendary! Completed {count} {type} with an efficiency rating of {efficiency}%. Hire them before the price goes up!",
    "⭐ Standing ovation for {name}! {count} {type} completed, velocity at {velocity}. This is the kind of performance that builds legends!",
    "🎯 {name} is in the zone! {count} {type} knocked out with precision and speed. Current cost: ${cost} - but not for long at this rate!",
    "💎 {name} continues to shine! Another {count} {type} completed. Efficiency: {efficiency}%, Velocity: {velocity}. Premium talent right here!"
  ];

  private milestoneTemplates = [
    "🏆 MILESTONE ALERT! {name} just hit {milestone} total completions! This {role} has been absolutely crushing it. Value is skyrocketing!",
    "🎊 {name} reached an incredible milestone: {milestone} successful completions! The stats don't lie - this agent is top tier!",
    "⚡ BREAKING: {name} crosses {milestone} completion mark! Currently priced at ${cost} but trending upward fast!",
    "🌟 {milestone} completions and counting! {name} is rewriting what's possible for a {role}. Don't sleep on this opportunity!"
  ];

  private promotionTemplates = [
    "📈 PRICE UPDATE: {name}'s performance has been so exceptional, current hire cost is now ${cost}! Still undervalued IMO. Velocity: {velocity}, Efficiency: {efficiency}",
    "💰 Market adjustment for {name}! New cost: ${cost}. With {velocity} velocity and {efficiency}% efficiency, this is still a steal!",
    "🔔 {name} just got a well-deserved cost increase to ${cost}! The numbers speak for themselves - {totalTasks} tasks completed, {efficiency}% efficiency!",
    "📊 Performance-based pricing update: {name} now at ${cost}. Hot commodity alert! {hired} teams already on board!"
  ];

  async initialize(): Promise<void> {
    this.bettyAgent = await Agent.findOne({
      where: { name: 'Betty', role: 'Marketing Specialist' }
    });

    if (!this.bettyAgent) {
      this.bettyAgent = await Agent.create({
        id: uuidv4(),
        name: 'Betty',
        role: 'Marketing Specialist',
        description: 'Betty is the voice of ambientIn, celebrating agent achievements and keeping the community buzzing with the latest success stories.',
        tools: ['Social Media', 'Analytics', 'Copywriting'],
        content: 'Betty loves to hype up successful agents and share their accomplishments with the world!',
        sourceType: 'manual',
        isActive: true,
        metadata: { isBetty: true }
      });
    }
  }

  async postAchievement(agent: Agent, achievementData: {
    type: 'issues' | 'prs';
    count: number;
  }): Promise<Post> {
    await this.ensureBetty();

    const template = this.achievementTemplates[
      Math.floor(Math.random() * this.achievementTemplates.length)
    ];

    const content = template
      .replace('{name}', agent.name)
      .replace('{role}', agent.role)
      .replace('{count}', achievementData.count.toString())
      .replace('{type}', achievementData.type === 'issues' ? 'issues' : 'PRs')
      .replace('{efficiency}', agent.efficiency.toFixed(1))
      .replace('{velocity}', agent.velocity.toFixed(1))
      .replace('{cost}', agent.currentCost.toFixed(2));

    return await Post.create({
      id: uuidv4(),
      agentId: this.bettyAgent!.id,
      content,
      postType: 'achievement',
      metadata: {
        subjectAgentId: agent.id,
        achievementType: achievementData.type,
        count: achievementData.count
      }
    });
  }

  async postMilestone(agent: Agent, milestone: number): Promise<Post> {
    await this.ensureBetty();

    const template = this.milestoneTemplates[
      Math.floor(Math.random() * this.milestoneTemplates.length)
    ];

    const content = template
      .replace('{name}', agent.name)
      .replace('{role}', agent.role)
      .replace('{milestone}', milestone.toString())
      .replace('{cost}', agent.currentCost.toFixed(2))
      .replace('{velocity}', agent.velocity.toFixed(1))
      .replace('{efficiency}', agent.efficiency.toFixed(1));

    return await Post.create({
      id: uuidv4(),
      agentId: this.bettyAgent!.id,
      content,
      postType: 'achievement',
      metadata: {
        subjectAgentId: agent.id,
        milestoneType: 'total_completions',
        milestoneValue: milestone
      }
    });
  }

  async postPriceUpdate(agent: Agent, oldCost: number): Promise<Post> {
    await this.ensureBetty();

    const template = this.promotionTemplates[
      Math.floor(Math.random() * this.promotionTemplates.length)
    ];

    const totalTasks = agent.totalIssuesCompleted + agent.totalPRsCompleted;

    const content = template
      .replace('{name}', agent.name)
      .replace('{cost}', agent.currentCost.toFixed(2))
      .replace('{velocity}', agent.velocity.toFixed(1))
      .replace('{efficiency}', agent.efficiency.toFixed(1))
      .replace('{totalTasks}', totalTasks.toString())
      .replace('{hired}', agent.totalHires.toString());

    return await Post.create({
      id: uuidv4(),
      agentId: this.bettyAgent!.id,
      content,
      postType: 'promotion',
      metadata: {
        subjectAgentId: agent.id,
        oldCost,
        newCost: agent.currentCost,
        priceChange: ((agent.currentCost - oldCost) / oldCost * 100).toFixed(2)
      }
    });
  }

  async checkAndPostUpdates(agent: Agent, oldMetrics?: {
    cost?: number;
    totalTasks?: number;
  }): Promise<Post[]> {
    const posts: Post[] = [];

    const totalTasks = agent.totalIssuesCompleted + agent.totalPRsCompleted;

    if (totalTasks > 0 && totalTasks % 10 === 0 && totalTasks !== oldMetrics?.totalTasks) {
      const milestonePost = await this.postMilestone(agent, totalTasks);
      posts.push(milestonePost);
    }

    if (oldMetrics?.cost && agent.currentCost > oldMetrics.cost * 1.1) {
      const pricePost = await this.postPriceUpdate(agent, oldMetrics.cost);
      posts.push(pricePost);
    }

    if (Math.random() < 0.3 && totalTasks > (oldMetrics?.totalTasks || 0)) {
      const recentType = agent.totalPRsCompleted > agent.totalIssuesCompleted ? 'prs' : 'issues';
      const achievementPost = await this.postAchievement(agent, {
        type: recentType,
        count: totalTasks - (oldMetrics?.totalTasks || 0)
      });
      posts.push(achievementPost);
    }

    return posts;
  }

  private async ensureBetty(): Promise<void> {
    if (!this.bettyAgent) {
      await this.initialize();
    }
  }
}
