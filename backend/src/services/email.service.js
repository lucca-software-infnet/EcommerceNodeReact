import { transporter } from "../config/email.js";
import { env } from "../config/env.js";

export const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    // fallback para desenvolvimento
    console.log("[email][dev]", { to, subject, html });
    return;
  }

  return await transporter.sendMail({
    from: `"Ecommerce" <${env.emailUser}>`,
    to,
    subject,
    html,
  });
};
