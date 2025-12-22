import { createClient } from "redis";
import { env } from "./env.js";

export const redis = createClient({
  url: env.redisUrl,
});

redis.on("error", (err) => {
  // não derruba o processo por padrão
  console.error("[redis] error:", err?.message || err);
});

