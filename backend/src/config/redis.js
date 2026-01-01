import { createClient } from "redis";
import { env } from "./env.js";

export const redis = createClient({
  url: env.redisUrl,
});

redis.on("connect", () => {
  console.log("🟥 Redis conectado");
});

redis.on("error", (err) => {
  console.error("[redis] error:", err?.message || err);
});
