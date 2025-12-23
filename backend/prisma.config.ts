import dotenv from "dotenv";
dotenv.config(); // garante que o .env seja lido

import { defineConfig } from "prisma/config";

export default defineConfig({
  // Mantém o schema original intacto e usa um schema de runtime
  // compatível com o Prisma Client (não altera o BD/migrations).
  schema: "prisma/schema.fixed.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!, // usa diretamente a variável do Node
  },
});
