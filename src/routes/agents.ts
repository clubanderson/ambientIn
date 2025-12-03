import { Router, Request, Response } from 'express';
import { AgentService } from '../services/agentService';
import { MetricsService } from '../services/metricsService';
import Agent from '../models/Agent';

const router = Router();
const agentService = new AgentService(process.env.GITHUB_TOKEN);
const metricsService = new MetricsService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, search, limit = 50, offset = 0 } = req.query;

    const where: any = { isActive: true };
    if (role) where.role = role;

    const agents = await Agent.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['velocity', 'DESC']]
    });

    res.json({ agents, total: agents.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findByPk(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import/github', async (req: Request, res: Response) => {
  try {
    const { repoUrl, filePath } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const agent = await agentService.createAgentFromGitHub(repoUrl, filePath);
    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import/repo', async (req: Request, res: Response) => {
  try {
    const { repoUrl, directory = 'agents' } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const agents = await agentService.importAgentsFromRepo(repoUrl, directory);
    res.status(201).json({ agents, count: agents.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, role, description, content, tools, avatarUrl } = req.body;

    if (!name || !role || !description || !content) {
      return res.status(400).json({
        error: 'name, role, description, and content are required'
      });
    }

    const agent = await agentService.createAgentManually({
      name,
      role,
      description,
      content,
      tools,
      avatarUrl
    });

    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const { metricType, completionTime, difficulty, success, metadata } = req.body;

    if (!metricType || completionTime === undefined) {
      return res.status(400).json({
        error: 'metricType and completionTime are required'
      });
    }

    const metric = await metricsService.recordMetric({
      agentId: req.params.id,
      metricType,
      completionTime,
      difficulty,
      success,
      metadata
    });

    res.status(201).json(metric);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const metrics = await metricsService.getAgentMetrics(req.params.id, days);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/trends', async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const trends = await metricsService.getMetricsTrends(req.params.id, days);
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
