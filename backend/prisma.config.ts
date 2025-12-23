import dotenv from "dotenv";
dotenv.config(); // garante que o .env seja lido

import { defineConfig } from "prisma/config";

export default defineConfig({
  // Mantém schema.prisma intacto; gera schema compatível em build/postinstall
  schema: "prisma/schema.generated.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!, // usa diretamente a variável do Node
  },
});
