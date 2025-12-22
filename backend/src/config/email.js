import nodemailer from "nodemailer"
import { env } from "./env.js"

export const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  }
})
