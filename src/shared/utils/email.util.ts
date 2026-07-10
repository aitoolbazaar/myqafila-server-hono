import * as nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;
let isEthereal = false;

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendEmail = async (options: EmailOptions) => {
  if (!cachedTransporter) {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(
        "ℹ️ SMTP credentials found in env. Creating production transporter...",
      );
      cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      isEthereal = false;
    } else {
      console.warn(
        "ℹ️ SMTP_USER or SMTP_PASS not set. Generating persistent/cached Ethereal test account...",
      );
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
    }
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || "'Gleq Studio' <no-reply@gleq.com>",
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await cachedTransporter.sendMail(mailOptions);

  console.log("✉️ Mail sent successfully: %s", info.messageId);
  if (isEthereal) {
    console.log(
      "🔗 Ethereal Preview URL: %s",
      nodemailer.getTestMessageUrl(info),
    );
  }

  return info;
};

export default sendEmail;
