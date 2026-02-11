const path = require('path');
const { PrismaClient } = require('@prisma/client');

const defaultDbUrl = `file:${path.resolve(__dirname, '../prisma/dev.db')}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || defaultDbUrl,
    },
  },
});

module.exports = prisma;
