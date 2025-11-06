# Complete Reset Script for FIX-061
# 此腳本會完全重置專案環境

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "開始執行完全重置..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步驟 1: 檢查 Node.js 進程
Write-Host "步驟 1: 檢查 Node.js 進程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "發現 $($nodeProcesses.Count) 個 Node.js 進程正在運行" -ForegroundColor Yellow
    Write-Host "請手動在終端按 Ctrl+C 停止開發伺服器，然後按任意鍵繼續..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
else {
    Write-Host "✓ 沒有 Node.js 進程在運行" -ForegroundColor Green
}
Write-Host ""

# 步驟 2: 清除編譯快取
Write-Host "步驟 2: 清除編譯快取..." -ForegroundColor Yellow
$cacheDirs = @(
    "apps\web\.next",
    ".turbo",
    "apps\web\.tsbuildinfo"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "  刪除 $dir ..." -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $dir) {
            Write-Host "  ⚠ 無法完全刪除 $dir" -ForegroundColor Yellow
        }
        else {
            Write-Host "  ✓ 已刪除 $dir" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ✓ $dir 不存在，跳過" -ForegroundColor Gray
    }
}
Write-Host ""

# 步驟 3: 等待文件解鎖
Write-Host "步驟 3: 等待 3 秒讓文件系統釋放鎖定..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "✓ 完成" -ForegroundColor Green
Write-Host ""

# 步驟 4: 刪除 node_modules
Write-Host "步驟 4: 刪除 node_modules（這可能需要 2-3 分鐘）..." -ForegroundColor Yellow

$nodeModulesDirs = @(
    "node_modules",
    "apps\web\node_modules"
)

foreach ($dir in $nodeModulesDirs) {
    if (Test-Path $dir) {
        Write-Host "  刪除 $dir ..." -ForegroundColor Gray

        # 使用 robocopy 刪除（更可靠）
        $emptyDir = New-Item -ItemType Directory -Path ".\empty_temp_dir_for_robocopy" -Force -ErrorAction SilentlyContinue
        if ($emptyDir) {
            robocopy $emptyDir.FullName $dir /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
            Remove-Item $emptyDir.FullName -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue

        if (Test-Path $dir) {
            Write-Host "  ⚠ 無法完全刪除 $dir" -ForegroundColor Yellow
            Write-Host "  請手動刪除或重啟電腦後再試" -ForegroundColor Red
        }
        else {
            Write-Host "  ✓ 已刪除 $dir" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ✓ $dir 不存在，跳過" -ForegroundColor Gray
    }
}
Write-Host ""

# 步驟 5: 清除 pnpm 快取
Write-Host "步驟 5: 清除 pnpm 快取..." -ForegroundColor Yellow
$pruneResult = pnpm store prune 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ pnpm 快取已清除" -ForegroundColor Green
}
else {
    Write-Host "⚠ 清除 pnpm 快取時出現錯誤（可以忽略）" -ForegroundColor Yellow
}
Write-Host ""

# 步驟 6: 重新安裝依賴
Write-Host "步驟 6: 重新安裝依賴（這可能需要 3-5 分鐘）..." -ForegroundColor Yellow
Write-Host "  執行: pnpm install" -ForegroundColor Gray
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 依賴安裝完成" -ForegroundColor Green
}
else {
    Write-Host "✗ 安裝依賴時出現錯誤" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 完成
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ 完全重置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "  1. 執行 'pnpm dev' 啟動開發伺服器" -ForegroundColor White
Write-Host "  2. 等待 'Ready' 訊息（首次啟動可能需要 1-2 分鐘）" -ForegroundColor White
Write-Host "  3. 使用無痕模式訪問測試頁面" -ForegroundColor White
Write-Host ""
