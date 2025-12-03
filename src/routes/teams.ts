import { Router, Request, Response } from 'express';
import { TeamService } from '../services/teamService';

const router = Router();
const teamService = new TeamService();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, name, description } = req.body;

    if (!userId || !name) {
      res.status(400).json({ error: 'userId and name are required' });
      return;
    }

    const team = await teamService.createTeam(userId, name, description);
    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const teams = await teamService.getUserTeams(req.params.userId);
    res.json(teams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const team = await teamService.getTeamWithMembers(req.params.id);
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await teamService.getTeamStats(req.params.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/recommendations', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const recommendations = await teamService.getRecommendedAgents(req.params.id, limit);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, position } = req.body;

    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return;
    }

    const member = await teamService.addAgentToTeam(req.params.id, agentId, position);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/members/:agentId', async (req: Request, res: Response) => {
  try {
    await teamService.removeAgentFromTeam(req.params.id, req.params.agentId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await teamService.deleteTeam(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
