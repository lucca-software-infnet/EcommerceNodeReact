import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

function requiredEnv(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === "") {
    // Não inclui valor para não vazar secrets em logs.
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return String(value).trim();
}

export const env = {
  // Dockerfile expõe 3333 e o Vite proxy aponta para 3333 por padrão
  port: Number(process.env.PORT) || 3333,

  // Em produção exigimos secrets via env.
  // Em desenvolvimento, fornecemos defaults para evitar crash quando não há .env.
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || (!isProd ? "dev_jwt_access_secret" : undefined),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || (!isProd ? "dev_jwt_refresh_secret" : undefined),
  jwtIssuer: process.env.JWT_ISSUER || "ecommerce-api",

  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  emailHost: process.env.EMAIL_HOST,
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,

  // Obrigatório: usado para CORS e retorno do Checkout Pro.
  frontendUrl: requiredEnv("FRONTEND_URL"),
  cookieSecure: process.env.COOKIE_SECURE === "true",

  // Mercado Pago (Checkout Pro)
  // NUNCA exponha este token no frontend.
  mercadoPagoAccessToken: requiredEnv("MERCADO_PAGO_ACCESS_TOKEN"),
};
