/**
 * Email Service - Epic 8 Story 8.1
 *
 * 功能說明:
 * - 提供統一的郵件發送服務
 * - 支援 Nodemailer (開發環境) 和 SendGrid (生產環境)
 * - 封裝郵件模板和發送邏輯
 * - 錯誤處理和日誌記錄
 *
 * 使用方式:
 * ```typescript
 * import { emailService } from '@/lib/email';
 *
 * await emailService.sendProposalSubmittedEmail({
 *   to: supervisor.email,
 *   proposalTitle: '專案A預算提案',
 *   proposalLink: 'https://app.com/proposals/123',
 *   submitterName: '張三'
 * });
 * ```
 */

import nodemailer from 'nodemailer';

// ==================================================================
// Email Service 配置
// ==================================================================

/**
 * Email 發送選項接口
 */
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * 郵件模板數據接口
 */
interface ProposalEmailData {
  to: string;
  proposalTitle: string;
  proposalLink: string;
  submitterName: string;
  supervisorName?: string;
}

interface ProposalStatusEmailData {
  to: string;
  proposalTitle: string;
  proposalLink: string;
  status: 'approved' | 'rejected' | 'more_info';
  comment?: string;
  reviewerName: string;
}

interface ExpenseEmailData {
  to: string;
  expenseAmount: number;
  projectName: string;
  expenseLink: string;
  submitterName: string;
}

// ==================================================================
// Email Service 實現
// ==================================================================

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeTransporter();
  }

  /**
   * 初始化郵件傳輸器
   * 開發環境使用 Ethereal Email (測試)
   * 生產環境使用 SendGrid/SMTP
   */
  private async initializeTransporter() {
    try {
      if (this.isProduction) {
        // 生產環境: 使用 SMTP 或 SendGrid
        if (process.env.SENDGRID_API_KEY) {
          // TODO: 整合 SendGrid (Story 8.1 後期優化)
          console.log('⚠️ SendGrid 整合待實現');
        } else if (process.env.SMTP_HOST) {
          // 使用自定義 SMTP
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
        }
      } else {
        // 開發環境: 使用 Ethereal Email (虛擬測試郵箱)
        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        console.log('📧 Email Service 初始化 (開發模式 - Ethereal Email)');
        console.log(`   測試郵箱: ${testAccount.user}`);
      }
    } catch (error) {
      console.error('❌ Email Service 初始化失敗:', error);
    }
  }

  /**
   * 發送郵件核心方法
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      if (!this.transporter) {
        console.error('❌ Email 傳輸器未初始化');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"IT專案管理平台" <noreply@example.com>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      // 開發環境顯示測試郵件預覽連結
      if (!this.isProduction) {
        console.log('📧 測試郵件已發送');
        console.log(`   預覽連結: ${nodemailer.getTestMessageUrl(info)}`);
      }

      console.log(`✅ 郵件已發送至 ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ 郵件發送失敗:', error);
      return false;
    }
  }

  // ==================================================================
  // 提案相關郵件模板
  // ==================================================================

  /**
   * 發送提案提交通知 (給主管)
   * Story 8.2: 當專案經理提交提案時通知主管
   */
  async sendProposalSubmittedEmail(data: ProposalEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 新的預算提案等待審批</h1>
            </div>
            <div class="content">
              <p>您好 ${data.supervisorName || '主管'},</p>

              <p><strong>${data.submitterName}</strong> 已提交一個新的預算提案，請您審批：</p>

              <div style="background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <strong>提案標題:</strong> ${data.proposalTitle}
              </div>

              <p>請點擊下方按鈕查看提案詳情並進行審批：</p>

              <div style="text-align: center;">
                <a href="${data.proposalLink}" class="button">查看提案</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                此郵件由系統自動發送，請勿直接回覆。
              </p>
            </div>
            <div class="footer">
              <p>IT專案管理平台 © 2025</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `[待審批] ${data.proposalTitle} - 預算提案`,
      html,
      text: `新的預算提案等待審批\n\n提案: ${data.proposalTitle}\n提交人: ${data.submitterName}\n\n查看詳情: ${data.proposalLink}`,
    });
  }

  /**
   * 發送提案審批結果通知 (給專案經理)
   * Story 8.2: 當主管審批提案後通知專案經理
   */
  async sendProposalStatusEmail(data: ProposalStatusEmailData): Promise<boolean> {
    const statusConfig = {
      approved: {
        emoji: '✅',
        title: '提案已批准',
        color: '#10b981',
        message: '您的預算提案已獲得批准，可以開始進行採購流程。'
      },
      rejected: {
        emoji: '❌',
        title: '提案被拒絕',
        color: '#ef4444',
        message: '您的預算提案未獲批准，請查看主管的意見。'
      },
      more_info: {
        emoji: 'ℹ️',
        title: '需要補充資訊',
        color: '#f59e0b',
        message: '主管需要您補充更多資訊，請查看意見並更新提案。'
      }
    };

    const config = statusConfig[data.status];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${config.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: ${config.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .comment { background-color: #fff; padding: 15px; border-left: 4px solid ${config.color}; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.emoji} ${config.title}</h1>
            </div>
            <div class="content">
              <p>您好,</p>

              <p>${config.message}</p>

              <div style="background-color: white; padding: 15px; border-left: 4px solid ${config.color}; margin: 20px 0;">
                <strong>提案標題:</strong> ${data.proposalTitle}<br>
                <strong>審批人:</strong> ${data.reviewerName}
              </div>

              ${data.comment ? `
                <div class="comment">
                  <strong>審批意見:</strong><br>
                  ${data.comment}
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${data.proposalLink}" class="button">查看提案</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                此郵件由系統自動發送，請勿直接回覆。
              </p>
            </div>
            <div class="footer">
              <p>IT專案管理平台 © 2025</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `[${config.title}] ${data.proposalTitle}`,
      html,
      text: `${config.title}\n\n提案: ${data.proposalTitle}\n審批人: ${data.reviewerName}${data.comment ? `\n意見: ${data.comment}` : ''}\n\n查看詳情: ${data.proposalLink}`,
    });
  }

  /**
   * 發送費用提交通知 (給主管)
   * Story 8.2: 當專案經理提交費用記錄時通知主管
   */
  async sendExpenseSubmittedEmail(data: ExpenseEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 新的費用記錄等待審批</h1>
            </div>
            <div class="content">
              <p>您好,</p>

              <p><strong>${data.submitterName}</strong> 已提交一筆新的費用記錄，請您審批：</p>

              <div style="background-color: white; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
                <strong>專案:</strong> ${data.projectName}<br>
                <strong>金額:</strong> NT$ ${data.expenseAmount.toLocaleString()}<br>
                <strong>提交人:</strong> ${data.submitterName}
              </div>

              <div style="text-align: center;">
                <a href="${data.expenseLink}" class="button">查看費用詳情</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                此郵件由系統自動發送，請勿直接回覆。
              </p>
            </div>
            <div class="footer">
              <p>IT專案管理平台 © 2025</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `[待審批] ${data.projectName} - 費用記錄 NT$ ${data.expenseAmount.toLocaleString()}`,
      html,
      text: `新的費用記錄等待審批\n\n專案: ${data.projectName}\n金額: NT$ ${data.expenseAmount.toLocaleString()}\n提交人: ${data.submitterName}\n\n查看詳情: ${data.expenseLink}`,
    });
  }

  /**
   * 發送費用審批結果通知 (給專案經理)
   */
  async sendExpenseApprovedEmail(data: ExpenseEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ 費用已批准</h1>
            </div>
            <div class="content">
              <p>您好,</p>

              <p>您提交的費用記錄已獲得批准。</p>

              <div style="background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                <strong>專案:</strong> ${data.projectName}<br>
                <strong>金額:</strong> NT$ ${data.expenseAmount.toLocaleString()}
              </div>

              <div style="text-align: center;">
                <a href="${data.expenseLink}" class="button">查看費用詳情</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                此郵件由系統自動發送，請勿直接回覆。
              </p>
            </div>
            <div class="footer">
              <p>IT專案管理平台 © 2025</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `[已批准] ${data.projectName} - 費用記錄 NT$ ${data.expenseAmount.toLocaleString()}`,
      html,
      text: `費用已批准\n\n專案: ${data.projectName}\n金額: NT$ ${data.expenseAmount.toLocaleString()}\n\n查看詳情: ${data.expenseLink}`,
    });
  }
}

// ==================================================================
// 導出單例
// ==================================================================

export const emailService = new EmailService();

// 導出類型定義
export type {
  EmailOptions,
  ProposalEmailData,
  ProposalStatusEmailData,
  ExpenseEmailData,
};
