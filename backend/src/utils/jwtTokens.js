import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

export function newJti() {
  return crypto.randomBytes(16).toString("hex");
}

export function signAccessToken(payload) {
  if (!env.jwtAccessSecret) throw new Error("JWT_ACCESS_SECRET não configurado");
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    issuer: env.jwtIssuer,
  });
}

export function signRefreshToken(payload) {
  if (!env.jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET não configurado");
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    issuer: env.jwtIssuer,
  });
}

export function verifyAccessToken(token) {
  if (!env.jwtAccessSecret) throw new Error("JWT_ACCESS_SECRET não configurado");
  return jwt.verify(token, env.jwtAccessSecret, { issuer: env.jwtIssuer });
}

export function verifyRefreshToken(token) {
  if (!env.jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET não configurado");
  return jwt.verify(token, env.jwtRefreshSecret, { issuer: env.jwtIssuer });
}

