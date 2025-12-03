import { Router, Request, Response } from 'express';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, displayName, bio, avatarUrl } = req.body;

    if (!username || !email || !displayName) {
      res.status(400).json({
        error: 'username, email, and displayName are required'
      });
      return;
    }

    const user = await User.create({
      id: uuidv4(),
      username,
      email,
      displayName,
      bio,
      avatarUrl
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/username/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({
      where: { username: req.params.username }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { displayName, bio, avatarUrl } = req.body;

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
