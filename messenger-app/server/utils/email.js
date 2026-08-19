import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmail(to, subject, html) {
  const info = await transporter.sendMail({
    from: `"ChatX" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

  console.log("Email sent successfully:", info.messageId);

  return info;
}
