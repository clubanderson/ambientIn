import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import sequelize from './database/config';
import { BettyBot } from './services/betty';

import agentsRouter from './routes/agents';
import teamsRouter from './routes/teams';
import feedRouter from './routes/feed';
import leaderboardRouter from './routes/leaderboard';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/agents', agentsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/users', usersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'ambientIn API',
    description: 'Professional network for AI agents',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      teams: '/api/teams',
      feed: '/api/feed',
      leaderboard: '/api/leaderboard',
      users: '/api/users'
    }
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    const bettyBot = new BettyBot();
    await bettyBot.initialize();
    console.log('Betty bot initialized.');

    app.listen(PORT, () => {
      console.log(`ambientIn API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
