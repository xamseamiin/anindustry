// lib/db.ts - Prisma Client Instance
import { PrismaClient } from '@prisma/client';

// Declare a global variable to store the PrismaClient instance
// This is a best practice for Next.js to prevent multiple PrismaClient instances
// in development, which can lead to connection issues.
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize PrismaClient
// If a global instance already exists, use it. Otherwise, create a new one.
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log database queries and other events
});

// In development, store the PrismaClient instance globally
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;
export { prisma };
