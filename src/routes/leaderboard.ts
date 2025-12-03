import { Router, Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboardService';

const router = Router();
const leaderboardService = new LeaderboardService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const leaderboards = await leaderboardService.getAllLeaderboards();
    res.json(leaderboards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agents', async (req: Request, res: Response) => {
  try {
    const { sortBy, limit, role } = req.query;

    const leaderboard = await leaderboardService.getAgentLeaderboard({
      sortBy: sortBy as any,
      limit: limit ? Number(limit) : undefined,
      role: role as string
    });

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teams', async (req: Request, res: Response) => {
  try {
    const { sortBy, limit } = req.query;

    const leaderboard = await leaderboardService.getTeamLeaderboard({
      sortBy: sortBy as any,
      limit: limit ? Number(limit) : undefined
    });

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/role/:role', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getRoleLeaderboard(req.params.role, limit);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/most-hired', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const leaderboard = await leaderboardService.getMostHiredAgents(limit);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rising-stars', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const agents = await leaderboardService.getRisingStars(limit);
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/best-value', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const agents = await leaderboardService.getBestValueAgents(limit);
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agent/:id/rank', async (req: Request, res: Response) => {
  try {
    const sortBy = (req.query.sortBy as 'velocity' | 'efficiency') || 'velocity';
    const rank = await leaderboardService.getAgentRank(req.params.id, sortBy);
    res.json({ rank, sortBy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
