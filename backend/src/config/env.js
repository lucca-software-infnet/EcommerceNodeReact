import dotenv from "dotenv"
dotenv.config()

export const env = {
  port: process.env.PORT || 3000,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtIssuer: process.env.JWT_ISSUER || "ecommerce-api",

  redisUrl: process.env.REDIS_URL,

  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  cookieSecure: process.env.COOKIE_SECURE === "true",
}
