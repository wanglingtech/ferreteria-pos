const { app } = require('./app');
const { prisma } = require('./config/database');
const { env } = require('./config/env');

const server = app.listen(env.PORT, () => {
  console.log(`Ferreteria July API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}. Closing API...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('API closed successfully.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
