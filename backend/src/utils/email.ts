import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Create reusable transporter
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure, // true for 465, false for other ports
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info({ 
        messageId: info.messageId, 
        to: options.to, 
        subject: options.subject 
      }, 'Email sent successfully');
      
      return true;
    } catch (error) {
      logger.error({ error, to: options.to }, 'Failed to send email');
      return false;
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    const subject = 'Verify Your Email - Al Dente';
    const text = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .code-box {
              background-color: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1f2937;
              font-family: 'Courier New', monospace;
            }
            .header {
              color: #1f2937;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              text-align: center;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Welcome to Al Dente! 🍝</div>
            <p>Thank you for signing up. Please verify your email address to get started.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
              <div class="code">${code}</div>
            </div>

            <p>Enter this code in the verification screen to complete your registration.</p>
            
            <div class="warning">
              <strong>⏱️ This code expires in 10 minutes.</strong>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't create an account with Al Dente, you can safely ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 Al Dente. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    const subject = 'Reset Your Password - Al Dente';
    const text = `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .code-box {
              background-color: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1f2937;
              font-family: 'Courier New', monospace;
            }
            .header {
              color: #1f2937;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              text-align: center;
            }
            .warning {
              background-color: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Password Reset Request 🔒</div>
            <p>We received a request to reset your password for your Al Dente account.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your password reset code is:</p>
              <div class="code">${code}</div>
            </div>

            <p>Enter this code to reset your password.</p>
            
            <div class="warning">
              <strong>⏱️ This code expires in 10 minutes.</strong>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 Al Dente. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }
}

export const emailService = new EmailService();

