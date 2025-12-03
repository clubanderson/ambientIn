import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface AgentAttributes {
  id: string;
  name: string;
  role: string;
  description: string;
  tools: string[];
  content: string;
  sourceType: 'github' | 'manual';
  sourceUrl?: string;
  avatarUrl?: string;
  velocity: number;
  efficiency: number;
  baseCost: number;
  currentCost: number;
  totalHires: number;
  totalIssuesCompleted: number;
  totalPRsCompleted: number;
  avgCompletionTime: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AgentCreationAttributes extends Optional<AgentAttributes, 'id' | 'avatarUrl' | 'sourceUrl' | 'velocity' | 'efficiency' | 'baseCost' | 'currentCost' | 'totalHires' | 'totalIssuesCompleted' | 'totalPRsCompleted' | 'avgCompletionTime' | 'isActive' | 'metadata'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  public id!: string;
  public name!: string;
  public role!: string;
  public description!: string;
  public tools!: string[];
  public content!: string;
  public sourceType!: 'github' | 'manual';
  public sourceUrl?: string;
  public avatarUrl?: string;
  public velocity!: number;
  public efficiency!: number;
  public baseCost!: number;
  public currentCost!: number;
  public totalHires!: number;
  public totalIssuesCompleted!: number;
  public totalPRsCompleted!: number;
  public avgCompletionTime!: number;
  public isActive!: boolean;
  public metadata!: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Agent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tools: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sourceType: {
      type: DataTypes.ENUM('github', 'manual'),
      allowNull: false
    },
    sourceUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    velocity: {
      type: DataTypes.FLOAT,
      defaultValue: 50.0
    },
    efficiency: {
      type: DataTypes.FLOAT,
      defaultValue: 50.0
    },
    baseCost: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0
    },
    currentCost: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0
    },
    totalHires: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalIssuesCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalPRsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgCompletionTime: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    tableName: 'agents',
    timestamps: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['role'] },
      { fields: ['velocity'] },
      { fields: ['efficiency'] },
      { fields: ['currentCost'] }
    ]
  }
);

export default Agent;
