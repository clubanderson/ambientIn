import { Router, Request, Response } from 'express';
import { FeedService } from '../services/feedService';

const router = Router();
const feedService = new FeedService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, offset, postType, agentId } = req.query;

    const result = await feedService.getFeed({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      postType: postType as string,
      agentId: agentId as string
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trending', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const posts = await feedService.getTrendingPosts(limit);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const posts = await feedService.getAgentPosts(req.params.agentId, limit);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, agentId, content } = req.body;

    if (!userId || !agentId || !content) {
      res.status(400).json({
        error: 'userId, agentId, and content are required'
      });
      return;
    }

    const post = await feedService.createUserPost(userId, agentId, content);
    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const post = await feedService.likePost(req.params.id);
    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const post = await feedService.sharePost(req.params.id);
    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
