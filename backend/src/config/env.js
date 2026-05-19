const dotenv = require('dotenv');

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
};

const requiredInAllModes = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of requiredInAllModes) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (Number.isNaN(env.PORT) || env.PORT < 1) {
  throw new Error('PORT must be a valid positive number');
}

module.exports = { env };
