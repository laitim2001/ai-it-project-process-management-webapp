---
runbook_type: account-takeover
applicable_severity: P0 / P1
status: 🚧 Draft (Phase 1 雛形)
parent: ../incident-response-plan.md
---

# Account Takeover Runbook（帳號接管應對）

> 適用：偵測到（或合理懷疑）用戶帳號被未授權人員接管時

---

## 偵測信號

- 帳號鎖定告警（FEAT-013.4 上線後，AuditLog 記錄）
- 用戶回報「我沒登入但系統顯示我登入了」
- AuditLog 異常登入位置（陌生 IP / 國家）
- 用戶資料 / 業務資料被異常修改
- 短時間多次密碼修改 / Email 修改
- 大量資料下載（單一帳號短時間操作多筆 record）

---

## 立即動作（前 15 分鐘）

- [ ] **1. 通報 IC**（涉 Admin / Supervisor 帳號 → P0）
- [ ] **2. 強制登出受影響帳號**：
  ```sql
  -- 撤銷 NextAuth session（DB 直接操作，謹慎）
  DELETE FROM "Session" WHERE "userId" = '<user_id>';
  ```
- [ ] **3. 停用帳號**：
  - 手動：DB 設定 `User.lockedUntil = '9999-12-31'` 或加 `disabled` flag
  - 或：透過 Admin UI（如有）
- [ ] **4. 通知用戶**：
  - 立即 email 通知（用備援聯絡方式，非該帳號 email）
  - 確認用戶身份（電話）
- [ ] **5. 保留證據**：匯出該帳號近 30 天 AuditLog

---

## 升級判斷

升級為 **P0 Critical** 條件：
- 涉及 Admin 帳號（可變更系統設定）
- 涉及 Supervisor 帳號（可核准 BudgetProposal / Expense）
- 攻擊者已修改業務資料
- 攻擊者已下載大量 PII

---

## 圍堵步驟

### 阻斷攻擊者持久性

- [ ] 撤銷該帳號所有 sessions（含 device 清單）
- [ ] 撤銷該帳號的 API tokens（如有）
- [ ] 檢查近 30 天 AuditLog：
  - 攻擊者新增了 User 或 Permission 嗎？
  - 攻擊者修改了 Role 嗎？
  - 攻擊者上傳了惡意檔案嗎？
- [ ] 撤銷 / 刪除攻擊者建立的 artifacts

### 識別攻擊路徑

- [ ] 檢查登入 log：
  - 異常登入來自 SSO 還是本地密碼？
  - 是否有 brute force 痕跡（FEAT-013.4 鎖定紀錄）？
  - 是否從用戶常用 IP？
- [ ] 詢問用戶：
  - 是否點擊過釣魚連結？
  - 是否在公共電腦登入未登出？
  - 密碼是否與其他系統共用（credential stuffing）？

### 評估擴散

- [ ] 攻擊者操作的資料是否影響其他用戶？
- [ ] 是否觸發其他帳號鎖定？（可能是廣泛 credential stuffing）

---

## 根除步驟

- [ ] 用戶重設密碼（透過 SSO 或管理員協助）
- [ ] Admin 解鎖帳號（FEAT-013.4 介面）
- [ ] 撤銷 + 重發必要的 credentials
- [ ] 撤銷攻擊者修改的資料（從 audit log 還原 — 需業務確認）
- [ ] 檢查是否需修補 IT 安全控制（如 IAM-06 MFA — 雖暫緩但可能需重評）

---

## 復原步驟

- [ ] 用戶確認可正常使用
- [ ] 監控該帳號 7 天活動
- [ ] 提醒用戶：
  - 不在公共電腦登入
  - 開啟 Azure SSO（如尚未）
  - 不重複使用密碼

---

## 證據保留清單

- [ ] AuditLog 該帳號近 30 天記錄（永久保留）
- [ ] App Service log（IP / User-Agent / 時間軸）
- [ ] 用戶回報內容（email / 通話紀錄）
- [ ] 攻擊者操作的所有 entity 變更（如有可還原）

---

## 對外通報判斷

### 用戶本人
- 立即通知（用備援聯絡方式）
- 提供清晰指引（重設密碼、檢查系統）

### 受影響的其他用戶
- 若攻擊者操作影響其他 record 擁有者，逐一通知

### 監管機關
- 涉 PII 洩漏 → 同 data breach 流程
- 單純帳號接管無 PII 洩漏 → 通常不需通報

### Management
- P0/P1 必須通報

---

## Post-Mortem 重點

- 攻擊路徑（brute force / phishing / credential stuffing / SSO 漏洞）？
- 防禦失效原因：
  - 帳號鎖定為何沒攔下？（攻擊者是用 SSO？）
  - 是否該強制 MFA？（SSO 已涵蓋還是有 fallback 帳號漏洞）
  - 是否該收緊本地 fallback 帳號的權限？
- 用戶端原因（弱密碼 / 重複密碼 / 釣魚）→ 培訓需求

---

**最後更新**: 2026-04-28
**狀態**: 🚧 Draft
