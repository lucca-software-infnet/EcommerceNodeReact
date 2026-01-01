import prismaPkg from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = prismaPkg;

// garante leitura do .env mesmo se prisma for importado antes do server boot


function adapterFromDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurado (necessário para Prisma v7 driver adapter)"
    );
  }

  const u = new URL(url);
  const host = u.hostname;
  const port = u.port ? Number(u.port) : 3306;
  const user = decodeURIComponent(u.username || "");
  const password = decodeURIComponent(u.password || "");
  const database = u.pathname?.replace(/^\//, "") || undefined;

  return new PrismaMariaDb({ host, port, user, password, database });
}

// Prisma singleton (evita múltiplas conexões em dev)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    adapter: adapterFromDatabaseUrl(),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

