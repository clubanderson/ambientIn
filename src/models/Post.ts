import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface PostAttributes {
  id: string;
  agentId: string;
  userId?: string;
  content: string;
  postType: 'achievement' | 'promotion' | 'announcement' | 'status';
  metadata: Record<string, any>;
  likes: number;
  shares: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'userId' | 'metadata' | 'likes' | 'shares'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public agentId!: string;
  public userId?: string;
  public content!: string;
  public postType!: 'achievement' | 'promotion' | 'announcement' | 'status';
  public metadata!: Record<string, any>;
  public likes!: number;
  public shares!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    postType: {
      type: DataTypes.ENUM('achievement', 'promotion', 'announcement', 'status'),
      allowNull: false,
      defaultValue: 'status'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shares: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    indexes: [
      { fields: ['agentId'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] },
      { fields: ['postType'] }
    ]
  }
);

export default Post;
