---
runbook_type: data-breach
applicable_severity: P0 / P1
status: 🚧 Draft (Phase 1 雛形)
parent: ../incident-response-plan.md
---

# Data Breach Runbook（資料洩漏應對）

> 適用：偵測到（或合理懷疑）用戶 PII / 業務資料外流時

---

## 偵測信號

- AuditLog 出現大量異常 SELECT（短時間大量讀取 User / 敏感資料）
- Azure Defender 告警（如有）
- 外部回報（資料出現在公開來源、客戶投訴）
- 應用 log 出現可疑 query 模式
- DB 連線異常（陌生 IP / 服務帳號）

---

## 立即動作（前 15 分鐘）

- [ ] **1. 通報 IC**（依 IR Plan §5 聯絡清單）
- [ ] **2. 確認事實**：是真實洩漏還是誤判？查 AuditLog 找具體操作 row
- [ ] **3. 隔離受影響系統**：
  - [ ] 若是帳號洩漏 → 強制該帳號登出 + 撤銷 session
  - [ ] 若是資料庫直接存取 → 檢查 DB 連線白名單，臨時收緊
  - [ ] 若是 API 端點 → 臨時禁用該端點（feature flag 或 maintenance mode）
- [ ] **4. 保留現場**：
  - [ ] 立即建立 DB snapshot（Azure PostgreSQL → backup）
  - [ ] 匯出近 24 小時 AuditLog（CSV / JSON）
  - [ ] 截圖 / 保存外部證據
- [ ] **5. 不刪除任何 log**

---

## 升級判斷

升級為 **P0 Critical** 條件（任一）：
- 涉及 ≥ 100 筆 PII
- 涉及 Admin 帳號 credentials
- 涉及財務資料（Budget / Expense / ChargeOut）
- 媒體 / 監管 / 客戶已知曉

---

## 圍堵步驟

- [ ] 撤銷可能洩漏的 credentials：
  - [ ] User passwords（強制重設）
  - [ ] API tokens / NEXTAUTH_SECRET
  - [ ] Azure AD client secret
  - [ ] DB connection string（如懷疑外流）
- [ ] 阻斷攻擊者持久性存取：
  - [ ] 檢查近 30 天 AuditLog 是否有異常權限變更
  - [ ] 檢查近 30 天新增的 User / Permission
- [ ] 通知相關用戶（如已確認影響）

---

## 根除步驟

- [ ] 識別根本原因（5 Whys）
- [ ] 程式碼修補：
  - [ ] 是 publicProcedure 漏洞？→ 改 protectedProcedure
  - [ ] 是 ownership 缺漏？→ 加檢查（FEAT-013.2）
  - [ ] 是 SQL injection？→ 改參數化
- [ ] 部署修補到生產
- [ ] 確認修補有效（重現原攻擊路徑應失敗）

---

## 復原步驟

- [ ] 解除臨時管制（端點、IP 限制）
- [ ] 監控 24-72h
- [ ] 通知用戶恢復（如有對外通知）

---

## 證據保留清單

- [ ] 事件相關 AuditLog（永久保留於 immutable Blob）
- [ ] DB snapshot（事件當時）
- [ ] 應用 log（App Service）
- [ ] Azure Activity Log
- [ ] 用戶回報內容
- [ ] 對外通訊紀錄（email / 客服紀錄）

存放：`incidents/INC-YYYY-NNN/evidence/`

---

## 對外通報判斷

### GDPR（涉歐盟資料主體）
- **24 小時內**通知監管機關（DPA）
- 通知範本：_placeholder_（法務提供）

### 台灣個資法
- **72 小時內**通知主管機關
- 通知資料主體（高風險時）

### 客戶 SLA
- 依合約時程
- Comms 角色聯絡

### 一般用戶
- 修補完成後通知（不過早通知導致恐慌或攻擊者警覺）

---

## Post-Mortem 範本

依 IR Plan §8 撰寫，重點：
- 哪些控制項本應阻止此事件？（如 IAM-10 ownership）
- 為何沒攔下？（漏實作 / 設計缺陷 / 監控盲點）
- 系統性改善（不是個人錯誤）

---

**最後更新**: 2026-04-28
**狀態**: 🚧 Draft — 待 Phase 2 完整演練後優化
