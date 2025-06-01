// File: src/lib/prisma.js - CORRECTED for default output

const { PrismaClient } = require("@prisma/client"); // <--- Change this line back

const prisma = new PrismaClient({
  // Optional: you can pass in a 'log' option to see queries
  // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
