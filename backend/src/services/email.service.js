import { transporter } from "../config/email.js"

export const sendEmail = async (to, subject, html) => {
  return await transporter.sendMail({
    from: `"Ecommerce" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  })
}
