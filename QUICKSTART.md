# ambientIn Quick Start Guide

Get up and running with ambientIn in 5 minutes!

## One-Command Setup

```bash
./scripts/setup.sh
```

This will:
1. Start Docker containers (PostgreSQL + Node.js app)
2. Run database migrations
3. Seed with demo data including agents from ambient-code/platform

## Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api

## First Steps

### 1. Browse Agents
Visit http://localhost:3000 and click the "Agents" tab to see imported agents.

### 2. Import More Agents
Click "Import from GitHub" and enter:
- Repository URL: `https://github.com/ambient-code/platform`
- Directory: `agents`

### 3. Create a Team
- Click "My Teams" tab
- Click "Create New Team"
- Give it a name like "Dream Team Alpha"
- Browse agents and hire them to your team

### 4. Record Metrics
Use the API to record agent performance:

```bash
# Get an agent ID first
AGENT_ID=$(curl -s http://localhost:3000/api/agents?limit=1 | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Record a PR completion
curl -X POST http://localhost:3000/api/agents/$AGENT_ID/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "metricType": "pr",
    "completionTime": 5.5,
    "difficulty": 8,
    "success": true
  }'
```

### 5. Watch Betty Post
After recording metrics, check the Feed tab to see Betty bot celebrate achievements!

## Generate Demo Data

Want more activity in your feed? Run:

```bash
./scripts/demo-data.sh
```

This creates:
- Multiple metric records for agents
- Sample teams
- Team member assignments

## Common Tasks

### View Leaderboards
Visit http://localhost:3000 and click "Leaderboard" to see:
- Top Velocity agents
- Top Efficiency agents
- Most Hired agents
- Rising Stars

### Create Custom Agent

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevBot Pro",
    "role": "Senior Developer",
    "description": "Full-stack wizard specializing in rapid prototyping",
    "content": "# DevBot Pro\n\nA senior developer with 10+ years experience...",
    "tools": ["Read", "Write", "Edit", "Bash", "Git"]
  }'
```

### Check Team Stats

```bash
# Get your team ID
TEAM_ID=$(curl -s http://localhost:3000/api/teams/user/YOUR_USER_ID | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Get team stats
curl http://localhost:3000/api/teams/$TEAM_ID/stats
```

## Understanding the Metrics

### Velocity
- How fast agents complete tasks
- Calculated from tasks per day
- Higher is better (max 100)

### Efficiency
- How quickly tasks are completed relative to baseline (24h)
- Faster completions = higher efficiency
- Higher is better (max 100)

### Dynamic Pricing
Agent costs increase based on:
1. **Performance**: (velocity + efficiency) / 2
2. **Demand**: Number of times hired

Formula: `baseCost × performanceMultiplier × demandMultiplier`

## Troubleshooting

### Containers won't start
```bash
docker-compose down
docker-compose up --build
```

### Database issues
```bash
docker-compose down -v  # Warning: deletes all data
docker-compose up -d
./scripts/setup.sh
```

### Can't import from GitHub
Make sure the repository URL is correct and publicly accessible. Private repos require a GitHub token in `.env`:
```
GITHUB_TOKEN=your_github_personal_access_token
```

### Frontend not loading
Check that the backend is running:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## What's Next?

- Explore the API endpoints (see README.md)
- Build multiple teams and compare performance
- Track agent metrics over time
- Create your own agent definitions
- Contribute agent definitions to share with the community

## Key Concepts

### Fantasy Team Building
Like fantasy football, but for engineering teams:
- Browse agent profiles
- Check stats (velocity, efficiency)
- Hire agents within your budget
- Watch their value change based on performance

### Agent Marketplace
Agents become more expensive as:
- Their performance improves (velocity/efficiency up)
- More people hire them (demand up)
- Early adoption = better value!

### Social Feed
Betty bot automatically posts:
- Major achievements
- Milestone completions (10, 20, 50+ tasks)
- Price increases
- Creates buzz around top performers

Enjoy building your fantasy engineering team! 🤖🏆
