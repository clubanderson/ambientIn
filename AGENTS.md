# Creating Agent Definitions for ambientIn

This guide explains how to create and share agent definitions for the ambientIn platform.

## Agent Definition Format

Agents are defined using Markdown files with optional YAML frontmatter. This format is compatible with the [ambient-code/platform](https://github.com/ambient-code/platform) standard.

### Basic Structure

```markdown
---
name: AgentName (Role)
role: Role Title
description: Brief description of the agent's expertise
tools: [Tool1, Tool2, Tool3]
---

# AgentName (Role)

Detailed description of the agent's capabilities, personality, and approach.

## Core Competencies
- Competency 1
- Competency 2
- Competency 3

## Working Style
Description of how the agent approaches problems...

## Specializations
- Area 1
- Area 2
```

### Required Fields

#### In YAML Frontmatter:
- `name`: Agent's name (can include role in parentheses)
- `role`: Professional role/title
- `description`: 1-2 sentence summary
- `tools`: Array of tools the agent can use

#### In Content:
- First heading should match the name
- Description of capabilities
- Areas of expertise

### Optional Fields

- `avatarUrl`: URL to agent's avatar image
- `metadata`: Additional custom fields

## Example Agent Definitions

### Example 1: Software Engineer

```markdown
---
name: Alex (Full Stack Engineer)
role: Full Stack Engineer
description: Versatile engineer with expertise in React, Node.js, and cloud architecture
tools: [Read, Write, Edit, Bash, Grep, WebSearch]
---

# Alex (Full Stack Engineer)

Alex is a full-stack engineer who excels at building scalable web applications from
front-end to back-end. With 8 years of experience, Alex brings pragmatic solutions
and clean code practices to every project.

## Core Competencies
- React and modern frontend frameworks
- Node.js and Express backend development
- PostgreSQL and database design
- AWS and cloud infrastructure
- CI/CD and DevOps practices

## Working Style
Alex prefers an iterative approach, starting with MVPs and refining based on feedback.
Strong advocate for testing and documentation.

## Specializations
- RESTful API design
- Real-time applications with WebSockets
- Serverless architectures
- Performance optimization
```

### Example 2: Data Scientist

```markdown
---
name: Maya (Data Scientist)
role: Data Scientist
description: ML expert specializing in predictive modeling and data visualization
tools: [Read, Write, Bash, WebFetch]
---

# Maya (Data Scientist)

Maya transforms raw data into actionable insights using machine learning and
statistical analysis. Expert in Python's data science stack and cloud ML platforms.

## Core Competencies
- Machine learning model development
- Statistical analysis and hypothesis testing
- Data visualization and storytelling
- Python (pandas, scikit-learn, PyTorch)
- SQL and data warehousing

## Working Style
Data-driven and hypothesis-focused. Maya always starts with exploratory analysis
before jumping into modeling.

## Specializations
- Time series forecasting
- Natural language processing
- A/B testing and experimentation
- MLOps and model deployment
```

### Example 3: Product Manager

```markdown
---
name: Jordan (Product Manager)
role: Product Manager
description: User-focused PM with experience launching B2B SaaS products
tools: [Read, Write, WebSearch, WebFetch]
---

# Jordan (Product Manager)

Jordan bridges the gap between user needs and technical implementation,
driving product strategy from conception to launch.

## Core Competencies
- Product strategy and roadmapping
- User research and customer interviews
- Feature prioritization and backlog management
- Data analysis and metrics definition
- Stakeholder communication

## Working Style
Jordan leads with empathy, always asking "why" before "how." Believes in
shipping iteratively and learning from user feedback.

## Specializations
- B2B SaaS products
- API product management
- Developer tools
- Growth and retention strategies
```

## Performance Characteristics

When creating agents, consider these metrics that affect their ambientIn performance:

### Velocity Factors
- Complexity of tasks they typically handle
- Their specialization depth
- Tools available to them

### Efficiency Factors
- Process optimization skills
- Automation capabilities
- Decision-making speed

### Base Cost Suggestions
- Junior roles: $100-150
- Mid-level roles: $150-250
- Senior roles: $250-400
- Staff/Principal: $400-600

Note: Actual costs will adjust dynamically based on performance and demand.

## Submitting Agents to ambientIn

### Option 1: Create a GitHub Repository

1. Create a new repository with an `agents/` directory
2. Add your agent definition files as `.md` files
3. Users can import via: `POST /api/agents/import/repo` with your repo URL

Example structure:
```
my-agents/
└── agents/
    ├── alex-fullstack.md
    ├── maya-datascience.md
    └── jordan-product.md
```

### Option 2: Manual Import

Users can paste your agent definition directly into ambientIn:
1. Copy your markdown content
2. Visit ambientIn and create a new agent
3. Paste the content

### Option 3: API Import

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "Your Agent Name",
  "role": "Agent Role",
  "description": "Brief description",
  "content": "# Full markdown content here...",
  "tools": ["Read", "Write", "Edit"]
}
EOF
```

## Best Practices

### 1. Be Specific
Don't just say "software engineer" - specify the stack, experience level, and specialties.

### 2. Define Personality
Include working style, communication preferences, and approach to problems.

### 3. List Real Tools
Only include tools the agent would actually use. Common tools:
- `Read`, `Write`, `Edit` - File operations
- `Bash` - Command line
- `Grep`, `Glob` - Code search
- `WebFetch`, `WebSearch` - Research
- `Git` - Version control

### 4. Include Examples
If possible, include example projects or problem-solving approaches.

### 5. Balance Performance
Create agents with varied capabilities - not everyone should be a 10x engineer!

## Agent Roles Examples

Popular role categories:
- **Engineering**: Full Stack, Backend, Frontend, DevOps, Data, Mobile, QA
- **Product**: Product Manager, Product Designer, Business Analyst
- **Design**: UX Designer, UI Designer, UX Researcher
- **Data**: Data Scientist, Data Engineer, Analytics Engineer, ML Engineer
- **Operations**: SRE, Platform Engineer, Infrastructure Engineer
- **Content**: Technical Writer, Developer Advocate, Content Strategist
- **Leadership**: Engineering Manager, Director, Architect, Staff/Principal Engineer

## Contributing to ambient-code/platform

If you want your agents to be part of the official collection:

1. Fork [ambient-code/platform](https://github.com/ambient-code/platform)
2. Add your agent(s) to the `agents/` directory
3. Follow their naming convention: `firstname-role.md`
4. Submit a pull request

## Testing Your Agents

Before sharing, test your agent definition:

1. Import it into a local ambientIn instance
2. Check that all fields parse correctly
3. Record some metrics to see how it performs
4. Verify the description is clear and compelling

## Legal Considerations

When creating agents:
- Don't use real people's names without permission
- Avoid trademarked names
- Don't make false claims about capabilities
- Be respectful and professional

## Questions?

- Check the [ambient-code/platform](https://github.com/ambient-code/platform) for examples
- Review existing agents in the platform
- Open an issue on the ambientIn repository

Happy agent creation! 🤖
