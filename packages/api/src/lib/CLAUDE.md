# API Libraries - API 工具層

## 📋 目錄用途
此目錄包含 API 層使用的工具和服務。

## 🏗️ 核心檔案

```
lib/
└── email.ts    # EmailService（SendGrid + Mailhog）
```

## 🎯 EmailService 模式

### 配置
```typescript
class EmailService {
  private sendgridApiKey: string | undefined;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@itpm.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'IT Project Management';
  }

  async sendEmail(params: EmailParams): Promise<void> {
    if (!this.sendgridApiKey) {
      // 開發環境：使用 Mailhog（不實際發送）
      console.log('[Mailhog] Email:', params);
      return;
    }

    // 生產環境：使用 SendGrid
    await sendgrid.send({
      to: params.to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: params.subject,
      html: params.html,
    });
  }
}
```

### 使用範例
```typescript
// packages/api/src/routers/notification.ts
import { EmailService } from '../lib/email';

const emailService = new EmailService();

await emailService.sendEmail({
  to: user.email,
  subject: '預算提案已批准',
  html: `<p>您的提案 ${proposal.id} 已批准</p>`,
});
```

## ⚠️ 重要約定

1. **開發環境使用 Mailhog**（不需 API Key）
2. **生產環境使用 SendGrid**（需設置 SENDGRID_API_KEY）
3. **Email 模板必須使用 HTML**
4. **錯誤必須妥善處理**（不阻塞主流程）

## 相關文件
- `packages/api/src/routers/notification.ts` - 使用 EmailService
- `.env` - Email 環境變數配置
