---
runbook_type: ddos
applicable_severity: P1 / P2
status: 🚧 Draft (Phase 1 雛形)
parent: ../incident-response-plan.md
---

# DDoS / 大量請求應對 Runbook

> 適用：偵測到 DDoS 或惡意大量請求導致服務中斷 / 性能異常時

---

## 偵測信號

- Rate limit 大量觸發（FEAT-013.3 上線後）
- App Service CPU / Memory 飆升
- 異常 IP 集中（單一 IP 或 IP 段大量請求）
- DB 連線數異常（連線池耗盡）
- 用戶回報「無法訪問」/「速度極慢」
- Azure Monitor 告警（如有設定）

---

## 立即動作（前 15 分鐘）

- [ ] **1. 通報 IC**
- [ ] **2. 確認類型**：
  - 真實 DDoS（攻擊性流量）？
  - 還是合法但異常的流量爆發（行銷活動 / bug 觸發 retry storm）？
- [ ] **3. 識別 IP 模式**：
  - 查 Azure App Service log，找 top 10 IP
  - 是否來自同一 IP / IP 段 / 國家？
- [ ] **4. 啟動 IP 封鎖**：
  - Azure App Service → Networking → Access Restrictions
  - 加 deny rule 阻擋可疑 IP
- [ ] **5. 監控擴散**：是否有新 IP 加入攻擊？

---

## 升級判斷

升級為 **P0 Critical** 條件：
- 服務完全不可用 ≥ 30 分鐘
- 影響業務關鍵時段（月底結算、客戶展示）
- 涉及威脅 / 勒索通訊

---

## 圍堵步驟

### 短期措施

- [ ] 啟用 Azure DDoS Protection Basic（如未啟用）
- [ ] 調低 rate limit 閾值（FEAT-013.3）
  - 全域：100 → 30 req/min/IP
  - 敏感端點：5 → 2 req/min
- [ ] 啟用 Azure Web Application Firewall（如有 Front Door — Phase 3）
- [ ] CDN 緩存（Cloudflare / Azure CDN）— 將靜態資源轉移

### 持續監控

- [ ] 開啟 Azure Portal → App Service → Live Metrics
- [ ] 監控指標：
  - Request count
  - Failed request count
  - Response time
  - CPU / Memory / Threads

### 通報 Azure Support

- 嚴重時開 Azure Support ticket（P0/P1）
- Azure 可協助流量分析 + 提供 DDoS Protection Standard 升級

---

## 根除步驟

依攻擊類型：

### Type A: 真實 DDoS（外部攻擊）
- 短期：IP 封鎖 + WAF rules
- 中期：升級到 Azure Front Door + WAF（Resi-02 — 暫緩 → 緊急時啟動）
- 長期：與 ISP 協調 / 申請 DDoS Protection Standard

### Type B: 合法異常流量（自家爆發）
- 找出觸發源：
  - 某個 API 客戶有 retry bug？
  - 行銷活動未先預警 IT？
- 修補 retry / backoff 邏輯
- 與業務同步事先預警機制

### Type C: 內部 bug 觸發
- 找 buggy code 並修補
- 加 unit test 防止 regression

---

## 復原步驟

- [ ] 解除 IP 封鎖（在攻擊停止 24h 後）
- [ ] 恢復 rate limit 為正常閾值
- [ ] 恢復臨時禁用的功能
- [ ] 監控 7 天確認攻擊未復發

---

## 證據保留清單

- [ ] App Service log（含 IP / User-Agent）
- [ ] Azure Activity Log
- [ ] Network log（若有 Front Door）
- [ ] Rate limit 觸發紀錄（Phase 2 含 AuditLog 後更完整）
- [ ] Azure Support ticket 紀錄

---

## 對外通報判斷

- **內部用戶**：服務中斷時 1h 內通知（email / 內部公告）
- **客戶（如有 SLA）**：依合約時程通知
- **媒體**：除非攻擊規模大到影響公司聲譽，否則低調處理

---

## Post-Mortem 重點

- 攻擊源？目的？是否有勒索通訊？
- 防禦失效原因（rate limit 太寬鬆？無 WAF？）
- 業務衝擊（多少用戶受影響？多少業務時間損失？）
- 投資建議（是否值得升級 Front Door + WAF？）

---

**最後更新**: 2026-04-28
**狀態**: 🚧 Draft
