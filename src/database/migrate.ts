import sequelize from './config';
import '../models';

async function migrate() {
  try {
    console.log('Starting database migration...');

    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ force: true });
    console.log('Database schema created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
