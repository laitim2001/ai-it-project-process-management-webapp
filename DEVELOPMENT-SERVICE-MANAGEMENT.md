# 🔧 開發服務管理指南

> **重要**: 避免多版本服務同時運行導致的測試混亂和資源浪費

---

## 🚨 **當前問題識別**

### **多服務端口問題**
在開發過程中發現了以下問題：
- 多個端口同時運行相同應用（3000-3005）
- 導致測試時連接到舊版本應用
- 造成bug修復狀態的錯誤判斷
- 大量Node.js進程消耗系統資源

---

## ✅ **正確的開發流程**

### **1. 開始開發前**
```bash
# 🔍 檢查現有服務
netstat -ano | findstr :300
tasklist | findstr node

# 🛑 停止所有相關服務（如果有）
taskkill /f /im node.exe
# 或針對特定PID: taskkill /f /PID [PID號碼]

# 🧹 清理緩存（如果需要）
rm -rf .next
rm -rf node_modules/.cache
```

### **2. 啟動唯一開發服務**
```bash
# ✅ 只啟動一個開發服務
npm run dev

# 📝 記錄當前端口（通常會自動分配可用端口）
# 示例輸出: Local: http://localhost:3000
```

### **3. 測試和驗證**
```bash
# 🔍 確認只有一個服務在運行
netstat -ano | findstr :300
# 應該只看到一個端口的監聽

# 🌐 測試正確的URL
curl http://localhost:[實際端口]/api/health
```

### **4. 代碼修改後**
```bash
# 🔄 Next.js會自動熱重載，通常不需要重啟
# 但如果遇到問題，使用Ctrl+C停止後重新啟動
npm run dev
```

---

## 🔄 **何時需要重新構建 (Rebuild)**

### **必須重新構建的情況**
1. **環境變數更改**
   ```bash
   # .env.local 文件更改後
   rm -rf .next
   npm run dev
   ```

2. **依賴包變更**
   ```bash
   # package.json 更改後
   npm install
   rm -rf .next
   npm run dev
   ```

3. **Next.js配置更改**
   ```bash
   # next.config.js 或 tailwind.config.js 更改後
   rm -rf .next
   npm run dev
   ```

4. **TypeScript配置更改**
   ```bash
   # tsconfig.json 更改後
   rm -rf .next
   npm run dev
   ```

5. **Webpack/模塊錯誤**
   ```bash
   # 出現模塊加載錯誤時
   rm -rf .next
   npm run dev
   ```

### **通常不需要重新構建**
- ✅ React組件文件修改
- ✅ CSS/Tailwind類名修改
- ✅ API路由文件修改
- ✅ TypeScript類型定義修改
- ✅ 大部分源代碼修改

---

## 🛠️ **故障排查流程**

### **問題**: 修改沒有生效
```bash
# 1. 檢查瀏覽器緩存
# Ctrl+Shift+R 強制刷新

# 2. 檢查是否連接到正確端口
netstat -ano | findstr :300

# 3. 重新構建
rm -rf .next
npm run dev
```

### **問題**: 端口被占用
```bash
# 1. 查找占用進程
netstat -ano | findstr :[端口號]

# 2. 停止占用進程
taskkill /f /PID [PID號碼]

# 3. 重新啟動
npm run dev
```

### **問題**: 多個服務運行
```bash
# 1. 停止所有Node.js進程
taskkill /f /im node.exe

# 2. 確認清理完成
tasklist | findstr node

# 3. 重新啟動單一服務
npm run dev
```

---

## 📋 **開發會話最佳實踐**

### **會話開始時**
1. ✅ 檢查並停止現有服務
2. ✅ 清理必要的緩存
3. ✅ 啟動單一開發服務
4. ✅ 記錄當前使用的端口

### **代碼修改過程中**
1. ✅ 依賴熱重載，避免頻繁重啟
2. ✅ 遇到問題時才重新構建
3. ✅ 測試前確認連接正確端口

### **會話結束時**
1. ✅ 停止開發服務 (Ctrl+C)
2. ✅ 可選：清理Node.js進程
3. ✅ 提交代碼到Git

---

## 🎯 **Claude Code AI助手指南**

### **自動檢查流程**
AI助手在每次會話開始時應該：
1. 🔍 檢查現有服務狀態
2. 🛑 識別並處理多服務問題
3. ✅ 確保只有一個開發服務運行
4. 📝 記錄當前服務狀態

### **重構建觸發條件**
AI助手應該在以下情況建議重新構建：
- 環境變數修改後
- 依賴包安裝/更新後
- 配置文件修改後
- 出現Webpack/模塊錯誤時
- 緩存相關問題時

### **避免的做法**
- ❌ 不檢查現有服務就啟動新服務
- ❌ 同時運行多個開發服務
- ❌ 忽略端口衝突問題
- ❌ 不清理緩存就重啟

---

## 📊 **監控指令速查**

```bash
# 檢查端口使用
netstat -ano | findstr :300

# 檢查Node.js進程
tasklist | findstr node

# 停止特定進程
taskkill /f /PID [PID]

# 停止所有Node.js進程
taskkill /f /im node.exe

# 清理Next.js緩存
rm -rf .next

# 啟動開發服務
npm run dev

# 測試健康狀態
curl http://localhost:[port]/api/health
```

---

**記住**: 保持單一服務運行是確保開發和測試準確性的關鍵！