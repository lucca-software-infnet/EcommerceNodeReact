import dotenv from "dotenv";
dotenv.config(); // garante que o .env seja lido

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!, // usa diretamente a variável do Node
  },
});
