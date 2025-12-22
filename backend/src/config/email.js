import nodemailer from "nodemailer"
import { env } from "./env.js"

export const transporter =
  env.emailHost && env.emailPort && env.emailUser && env.emailPass
    ? nodemailer.createTransport({
        host: env.emailHost,
        port: Number(env.emailPort),
        secure: Number(env.emailPort) === 465,
        auth: {
          user: env.emailUser,
          pass: env.emailPass,
        },
      })
    : null;
