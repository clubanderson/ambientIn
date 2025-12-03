import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface TeamMemberAttributes {
  id: string;
  teamId: string;
  agentId: string;
  position: string;
  costAtHire: number;
  joinedAt: Date;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, 'id' | 'position' | 'metadata'> {}

class TeamMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> implements TeamMemberAttributes {
  public id!: string;
  public teamId!: string;
  public agentId!: string;
  public position!: string;
  public costAtHire!: number;
  public joinedAt!: Date;
  public metadata!: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.STRING,
      defaultValue: 'member'
    },
    costAtHire: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    tableName: 'team_members',
    timestamps: true,
    indexes: [
      { fields: ['teamId'] },
      { fields: ['agentId'] },
      { fields: ['teamId', 'agentId'], unique: true }
    ]
  }
);

export default TeamMember;
