
const { PrismaClient } = require('@prisma/client');

// Use the connection string provided in the prompt
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.msfytatwfkcrswmmvhqk:Amr772473005+@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
  },
});

module.exports = prisma;
