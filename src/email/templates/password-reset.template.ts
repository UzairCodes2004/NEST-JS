export interface PasswordResetTemplateParams {
  resetLink: string;
  year: number;
}

export const passwordResetTemplate = ({ resetLink, year }: PasswordResetTemplateParams): string => {
  return `
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
            <p>&copy; ${year} Your App. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};