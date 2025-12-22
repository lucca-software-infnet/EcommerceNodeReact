import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn
  });

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn
  });

  return { accessToken, refreshToken };
}
