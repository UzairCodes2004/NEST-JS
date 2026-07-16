import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { Transporter } from "nodemailer";
import { passwordResetTemplate } from "./templates/password-reset.template";

@Injectable()
export class EmailService {
  private transporter!: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userEmail: string): Promise<void> {
    const payload = { email: userEmail, token: resetToken };
    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const encoded = encodeURIComponent(base64);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?data=${encoded}`;
    const year = new Date().getFullYear();

    // Use the template
    const htmlContent = passwordResetTemplate({ resetLink, year });

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Reset Your Password',
      html: htmlContent,
    });
  }
}