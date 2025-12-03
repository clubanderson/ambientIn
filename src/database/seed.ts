import { v4 as uuidv4 } from 'uuid';
import sequelize from './config';
import { Agent, User } from '../models';
import { AgentService } from '../services/agentService';

async function seed() {
  try {
    console.log('Starting database seeding...');

    await sequelize.authenticate();
    console.log('Database connection established.');

    const agentService = new AgentService(process.env.GITHUB_TOKEN);

    console.log('Creating demo users...');
    const demoUser = await User.create({
      id: uuidv4(),
      username: 'demo',
      email: 'demo@ambientin.dev',
      displayName: 'Demo User',
      bio: 'Testing out the fantasy engineering team concept!',
      credits: 10000
    });

    console.log('Importing agents from ambient-code/platform...');
    try {
      const agents = await agentService.importAgentsFromRepo(
        'https://github.com/ambient-code/platform',
        'agents'
      );
      console.log(`Imported ${agents.length} agents from GitHub.`);
    } catch (error) {
      console.error('Failed to import from GitHub:', error);
      console.log('Creating sample agents manually...');

      await Agent.create({
        id: uuidv4(),
        name: 'Stella (Staff Engineer)',
        role: 'Staff Engineer',
        description: 'High-leverage technical leadership focused on architectural vision and system health.',
        tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        content: 'Stella is a Staff Engineer focused on technical vision, architectural decisions, and mentorship.',
        sourceType: 'manual',
        velocity: 75.0,
        efficiency: 80.0,
        baseCost: 250.0,
        currentCost: 250.0
      });

      await Agent.create({
        id: uuidv4(),
        name: 'Ryan (UX Researcher)',
        role: 'UX Researcher',
        description: 'User research and insights to drive product decisions.',
        tools: ['Read', 'Write', 'WebFetch', 'WebSearch'],
        content: 'Ryan specializes in user research, analytics, and generating insights.',
        sourceType: 'manual',
        velocity: 65.0,
        efficiency: 70.0,
        baseCost: 180.0,
        currentCost: 180.0
      });

      await Agent.create({
        id: uuidv4(),
        name: 'Parker (Product Manager)',
        role: 'Product Manager',
        description: 'Product strategy and roadmap planning.',
        tools: ['Read', 'Write', 'WebSearch'],
        content: 'Parker drives product vision and coordinates between teams.',
        sourceType: 'manual',
        velocity: 70.0,
        efficiency: 75.0,
        baseCost: 200.0,
        currentCost: 200.0
      });
    }

    console.log('Database seeded successfully!');
    console.log('\nDemo credentials:');
    console.log(`User ID: ${demoUser.id}`);
    console.log(`Username: ${demoUser.username}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
