import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface TeamAttributes {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalCost: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamCreationAttributes extends Optional<TeamAttributes, 'id' | 'description' | 'totalCost' | 'isActive' | 'metadata'> {}

class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public description?: string;
  public totalCost!: number;
  public isActive!: boolean;
  public metadata!: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Team.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalCost: {
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
    tableName: 'teams',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['name'] }
    ]
  }
);

export default Team;
