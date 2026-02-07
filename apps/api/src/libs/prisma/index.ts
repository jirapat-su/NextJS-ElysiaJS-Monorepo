import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { env } from '../../env';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient | null = null;

const connectionConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string(),
  database: z.string().min(1),
});

type ConnectionConfig = z.infer<typeof connectionConfigSchema>;

/**
 * Parses the DATABASE_URL to extract connection details for mysql2.
 * Validates the configuration using Zod.
 */
function parseDatabaseUrl(url: string): ConnectionConfig {
  try {
    const connectionUrl = new URL(url);
    const rawConfig = {
      host: connectionUrl.hostname,
      port: Number.parseInt(connectionUrl.port || '3306', 10),
      user: connectionUrl.username,
      password: decodeURIComponent(connectionUrl.password),
      database: connectionUrl.pathname.substring(1),
    };

    return connectionConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      console.error(`[DB Config Validation Error] ${formattedErrors}`);
      throw new Error(`Invalid database connection string: ${formattedErrors}`);
    }

    if (error instanceof TypeError) {
      console.error(`[DB URL Parsing Error] ${error.message}`);
      throw new Error(
        `Failed to parse database connection string: ${error.message}`
      );
    }

    throw error;
  }
}

function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  const connectionInfo = parseDatabaseUrl(env.DATABASE_URL);
  const adapter = new PrismaMariaDb(connectionInfo);

  prismaInstance = new PrismaClient({ adapter });

  if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

// For backwards compatibility
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  },
});
