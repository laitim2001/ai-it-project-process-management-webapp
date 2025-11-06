# Complete Reset Script
Write-Host "========================================"
Write-Host "開始執行完全重置..."
Write-Host "========================================"
Write-Host ""

# 步驟 1: 檢查 Node.js 進程
Write-Host "步驟 1: 檢查 Node.js 進程..."
$nodeProc = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProc) {
    Write-Host "警告: 發現 Node.js 進程正在運行"
    Write-Host "請先按 Ctrl+C 停止開發伺服器，然後按任意鍵繼續..."
    Read-Host
}

# 步驟 2: 清除編譯快取
Write-Host ""
Write-Host "步驟 2: 清除編譯快取..."
if (Test-Path "apps\web\.next") {
    Remove-Item "apps\web\.next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  已刪除 .next"
}
if (Test-Path ".turbo") {
    Remove-Item ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  已刪除 .turbo"
}

# 步驟 3: 等待
Write-Host ""
Write-Host "步驟 3: 等待文件解鎖..."
Start-Sleep -Seconds 3

# 步驟 4: 刪除 node_modules (使用 robocopy)
Write-Host ""
Write-Host "步驟 4: 刪除 node_modules (可能需要 2-3 分鐘)..."

if (Test-Path "node_modules") {
    Write-Host "  刪除根目錄 node_modules..."
    $empty = New-Item -ItemType Directory -Path "empty_temp" -Force
    robocopy $empty.FullName "node_modules" /MIR /R:0 /W:0 | Out-Null
    Remove-Item "empty_temp" -Force
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  完成"
}

if (Test-Path "apps\web\node_modules") {
    Write-Host "  刪除 apps/web node_modules..."
    $empty = New-Item -ItemType Directory -Path "empty_temp" -Force
    robocopy $empty.FullName "apps\web\node_modules" /MIR /R:0 /W:0 | Out-Null
    Remove-Item "empty_temp" -Force
    Remove-Item "apps\web\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  完成"
}

# 步驟 5: 清除 pnpm 快取
Write-Host ""
Write-Host "步驟 5: 清除 pnpm 快取..."
pnpm store prune | Out-Null
Write-Host "  完成"

# 步驟 6: 重新安裝
Write-Host ""
Write-Host "步驟 6: 重新安裝依賴 (可能需要 3-5 分鐘)..."
pnpm install

Write-Host ""
Write-Host "========================================"
Write-Host "重置完成!"
Write-Host "========================================"
Write-Host ""
Write-Host "下一步:"
Write-Host "  1. 執行 'pnpm dev'"
Write-Host "  2. 等待 Ready 訊息"
Write-Host "  3. 使用無痕模式測試"
Write-Host ""
