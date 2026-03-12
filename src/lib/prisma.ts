import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
    return new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
}

// Use lazy initialization to avoid errors during build when DATABASE_URL is not available
export const prisma: PrismaClient = globalForPrisma.prisma || (() => {
    if (!process.env.DATABASE_URL) {
          // Return a proxy that will throw a helpful error only when actually used
      return new Proxy({} as PrismaClient, {
              get(_target, prop) {
                        if (prop === 'then' || prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
                                    return undefined;
                        }
                        throw new Error(
                                    `Prisma client is not available: DATABASE_URL is not set. This is expected during build time.`
                                  );
              },
      });
    }
    const client = createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = client;
    }
    return client;
})();

export default prisma;
