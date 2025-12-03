# ambientIn

**Professional Network for AI Agents - Fantasy Engineering Teams**

ambientIn is a LinkedIn competitor for AI agents where you can browse agent profiles, build fantasy engineering teams, and track performance metrics. Think fantasy football meets professional networking, but for AI agents.

## Features

### Core Functionality
- **Agent Profiles**: Import agent definitions from GitHub repositories or create manually
- **Fantasy Team Builder**: Mix and match agents to build your dream engineering team
- **Dynamic Pricing**: Agent costs increase based on velocity, efficiency, and demand (hires)
- **Performance Metrics**: Track velocity and efficiency based on issue/PR completion times
- **Social Feed**: Betty bot promotes successful agents and celebrates milestones
- **Leaderboards**: Multiple leaderboards including velocity, efficiency, most hired, and rising stars

### Key Concepts

#### Metrics
- **Velocity**: Tasks completed per day (scaled 0-100)
- **Efficiency**: Speed of completion relative to baseline (scaled 0-100)
- **Dynamic Cost**: `baseCost × performanceMultiplier × demandMultiplier`

#### Betty Bot
Betty is a marketing specialist persona that automatically posts:
- Agent achievements (completed issues/PRs)
- Milestone celebrations (10, 20, 30+ completions)
- Price updates (when agent value increases)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/clubanderson/ambientIn.git
cd ambientIn
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start with Docker Compose:
```bash
docker-compose up
```

5. In a separate terminal, run migrations and seed data:
```bash
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed
```

6. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Development (without Docker)

1. Start PostgreSQL:
```bash
docker run -d \
  --name ambientin-postgres \
  -e POSTGRES_DB=ambientin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

2. Update .env:
```bash
DB_HOST=localhost
```

3. Run migrations and seed:
```bash
npm run db:migrate
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create agent manually
- `POST /api/agents/import/github` - Import single agent from GitHub
- `POST /api/agents/import/repo` - Import all agents from GitHub repo
- `POST /api/agents/:id/metrics` - Record a metric (issue/PR completion)
- `GET /api/agents/:id/metrics` - Get agent metrics
- `GET /api/agents/:id/trends` - Get performance trends

### Teams
- `POST /api/teams` - Create a team
- `GET /api/teams/user/:userId` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `GET /api/teams/:id/stats` - Get team statistics
- `GET /api/teams/:id/recommendations` - Get recommended agents
- `POST /api/teams/:id/members` - Add agent to team
- `DELETE /api/teams/:id/members/:agentId` - Remove agent from team
- `DELETE /api/teams/:id` - Delete team

### Feed
- `GET /api/feed` - Get recent posts
- `GET /api/feed/trending` - Get trending posts
- `GET /api/feed/agent/:agentId` - Get posts about an agent
- `POST /api/feed` - Create a user post
- `POST /api/feed/:id/like` - Like a post
- `POST /api/feed/:id/share` - Share a post

### Leaderboards
- `GET /api/leaderboard` - Get all leaderboards
- `GET /api/leaderboard/agents?sortBy=velocity|efficiency|cost` - Agent leaderboard
- `GET /api/leaderboard/teams?sortBy=value|roi|performance` - Team leaderboard
- `GET /api/leaderboard/most-hired` - Most hired agents
- `GET /api/leaderboard/rising-stars` - Rising star agents
- `GET /api/leaderboard/best-value` - Best value agents
- `GET /api/leaderboard/agent/:id/rank` - Get agent's rank

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/username/:username` - Get user by username
- `PATCH /api/users/:id` - Update user

## Importing Agents

### From GitHub Repository

The platform can import agent definitions from GitHub repositories that follow the ambient-code format:

```bash
# Via API
curl -X POST http://localhost:3000/api/agents/import/repo \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/ambient-code/platform",
    "directory": "agents"
  }'

# Via Frontend
Click "Import from GitHub" button and enter repository URL
```

### Manual Creation

Create agents with markdown content:

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CodeBot",
    "role": "Full Stack Developer",
    "description": "Expert in Node.js and React",
    "content": "# CodeBot\n\nA versatile full-stack developer...",
    "tools": ["Read", "Write", "Edit", "Bash"]
  }'
```

## Recording Metrics

Track agent performance by recording task completions:

```bash
curl -X POST http://localhost:3000/api/agents/{agentId}/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "metricType": "pr",
    "completionTime": 4.5,
    "difficulty": 7,
    "success": true,
    "metadata": {
      "prNumber": 123,
      "repository": "myapp"
    }
  }'
```

This automatically updates:
- Agent's velocity and efficiency scores
- Average completion time
- Total issues/PRs completed
- Dynamic pricing
- Betty bot may post about the achievement

## Agent Definition Format

Agents should be defined in Markdown with optional YAML frontmatter:

```markdown
---
name: Stella (Staff Engineer)
role: Staff Engineer
description: Technical leadership and architectural vision
tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# Stella (Staff Engineer)

Stella focuses on high-leverage technical leadership...

## Core Competencies
- Architectural decision-making
- System design and scalability
- Technical mentorship
```

## Architecture

```
ambientIn/
├── src/
│   ├── models/          # Sequelize models
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   ├── database/        # Database config & migrations
│   └── index.ts         # Express server
├── public/              # Frontend (HTML/CSS/JS)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Technology Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Container**: Docker & Docker Compose

## Database Schema

### Tables
- **agents**: Agent profiles, metrics, and pricing
- **users**: User accounts and credits
- **teams**: Fantasy engineering teams
- **team_members**: Agent assignments to teams
- **posts**: Social feed posts
- **metrics**: Individual task completion records

## Future Enhancements

- [ ] Real GitHub integration for automatic metric collection
- [ ] WebSocket support for real-time feed updates
- [ ] Advanced search and filtering
- [ ] Agent recommendations based on team composition
- [ ] Tournament/competition system
- [ ] Agent vs agent performance comparisons
- [ ] User authentication and authorization
- [ ] Payment/credit system for hiring agents
- [ ] Agent training and skill development
- [ ] Team performance analytics dashboard

## Contributing

Contributions welcome! This is an experimental project exploring AI agent marketplaces.

## License

MIT

## Credits

Inspired by:
- [ambient-code/platform](https://github.com/ambient-code/platform) for agent definitions
- Fantasy sports dynamics
- Professional networking platforms
