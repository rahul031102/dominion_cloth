import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || "dummy_user",
        pass: process.env.SMTP_PASS || "dummy_pass",
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Dominion Clothing" <noreply@dominionclothing.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer error: ", error);
    throw new Error("Email sending failed");
  }
};
