import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private transporter!: Transporter;
  constructor() {

    this.transporter = nodemailer.createTransport({

      host: process.env.SMTP_HOST,

      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: false, // tue for 45 false for 587 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    })
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userEmail: string): Promise<void> {

    const payload = { email: userEmail, token: resetToken };

    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');

    const encoded = encodeURIComponent(base64);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?data=${encoded}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <p style="text-align: center;">
                <a style="color: #ffffff;" href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>This link will expire in 15 minutes.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Reset Your Password',
      html: htmlContent,
    })

  }
}
