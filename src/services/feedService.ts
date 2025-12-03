import Post from '../models/Post';
import Agent from '../models/Agent';
import User from '../models/User';
import { Op } from 'sequelize';

export class FeedService {
  async getFeed(options: {
    limit?: number;
    offset?: number;
    postType?: string;
    agentId?: string;
  } = {}): Promise<{ posts: Post[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      postType,
      agentId
    } = options;

    const where: any = {};

    if (postType) {
      where.postType = postType;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    const { rows: posts, count: total } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'name', 'role', 'avatarUrl']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return { posts, total };
  }

  async getAgentPosts(agentId: string, limit: number = 20): Promise<Post[]> {
    return await Post.findAll({
      where: {
        [Op.or]: [
          { agentId },
          { 'metadata.subjectAgentId': agentId }
        ]
      },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'name', 'role', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  async likePost(postId: string): Promise<Post> {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    post.likes += 1;
    await post.save();

    return post;
  }

  async sharePost(postId: string): Promise<Post> {
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    post.shares += 1;
    await post.save();

    return post;
  }

  async createUserPost(userId: string, agentId: string, content: string): Promise<Post> {
    return await Post.create({
      userId,
      agentId,
      content,
      postType: 'status',
      metadata: {}
    });
  }

  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await Post.findAll({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'name', 'role', 'avatarUrl']
        }
      ],
      order: [
        [sequelize.literal('likes + shares * 2'), 'DESC']
      ],
      limit
    });
  }
}

import sequelize from '../database/config';
