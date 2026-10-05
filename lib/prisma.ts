import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { salonPrisma?: PrismaClient };

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
    throw new Error(
      "Configure DATABASE_URL with a PostgreSQL connection string.",
    );
  }
  globalForPrisma.salonPrisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  return globalForPrisma.salonPrisma;
}
