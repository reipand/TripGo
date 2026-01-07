import nodemailer from 'nodemailer';

interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class Mailer {
  private transporter: nodemailer.Transporter | null = null;
  private config: MailerConfig;

  constructor() {
    this.config = this.getConfig();
    this.initializeTransporter();
  }

  private getConfig(): MailerConfig {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!user || !pass) {
      console.warn('⚠️ SMTP credentials not configured. Email functionality will be limited.');
    }

    return {
      host,
      port,
      secure: port === 465, // 465 is SSL, 587 is TLS
      auth: {
        user,
        pass,
      },
    };
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection configuration
      this.transporter.verify((error: any) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
          this.transporter = null;
        } else {
          console.log('✅ SMTP connection ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize mailer:', error);
      this.transporter = null;
    }
  }

  public getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      throw new Error('Mailer not initialized. Check SMTP configuration.');
    }
    return this.transporter;
  }

  public async sendMail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }) {
    if (!this.transporter) {
      throw new Error('Mailer not available');
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@tripgo.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'TripGo';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      headers: {
        'X-Mailer': 'TripGo Mailer 1.0',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Email sent:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error: any) {
      console.error('❌ Email sending failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
        to: options.to,
      });

      throw error;
    }
  }

  public isAvailable(): boolean {
    return this.transporter !== null;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const mailerInstance = new Mailer();

// Export singleton instance
export const mailer = mailerInstance;

// Export functions for backward compatibility
export function getTransporter() {
  return mailerInstance.getTransporter();
}

export async function sendMail(options: Parameters<Mailer['sendMail']>[0]) {
  return mailerInstance.sendMail(options);
}

export function isMailerAvailable() {
  return mailerInstance.isAvailable();
}

export async function testMailerConnection() {
  return mailerInstance.testConnection();
}