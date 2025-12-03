import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface MetricAttributes {
  id: string;
  agentId: string;
  metricType: 'issue' | 'pr' | 'task';
  completionTime: number;
  difficulty: number;
  success: boolean;
  metadata: Record<string, any>;
  recordedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MetricCreationAttributes extends Optional<MetricAttributes, 'id' | 'difficulty' | 'success' | 'metadata'> {}

class Metric extends Model<MetricAttributes, MetricCreationAttributes> implements MetricAttributes {
  public id!: string;
  public agentId!: string;
  public metricType!: 'issue' | 'pr' | 'task';
  public completionTime!: number;
  public difficulty!: number;
  public success!: boolean;
  public metadata!: Record<string, any>;
  public recordedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Metric.init(
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
    metricType: {
      type: DataTypes.ENUM('issue', 'pr', 'task'),
      allowNull: false
    },
    completionTime: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    difficulty: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'metrics',
    timestamps: true,
    indexes: [
      { fields: ['agentId'] },
      { fields: ['metricType'] },
      { fields: ['recordedAt'] }
    ]
  }
);

export default Metric;
