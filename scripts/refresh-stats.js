#!/usr/bin/env node
/**
 * @fileoverview refresh-stats.js — 輕量模式：重新計算 codebase 統計並比對 SUMMARY.md
 * @usage
 *   node scripts/refresh-stats.js               # 乾跑模式（只顯示差異，不寫入）
 *   node scripts/refresh-stats.js --apply       # 實際寫入 SUMMARY.md 的 machine-readable-stats
 *   node scripts/refresh-stats.js --json        # JSON 輸出（給上層工具解析）
 * @description
 *   方案 B.1 — 輕量模式
 *   直接從 codebase 掃描產生最新統計數字，與 SUMMARY.md 的 machine-readable-stats 比對。
 *   不跑完整 codebase-analyze playbook，只更新數字區塊。
 *   完整重跑請用 `/itpm:refresh-codebase-analysis`（方案 B.2）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SUMMARY_PATH = path.join(ROOT, 'docs/codebase-analyze/SUMMARY.md');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const JSON_OUT = args.includes('--json');

// ============================================================
// 實測統計
// ============================================================
function countFiles(dir, predicate, skip = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo']) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) count += countFiles(p, predicate, skip);
    else if (predicate(e.name, p)) count++;
  }
  return count;
}

function sumLines(dir, predicate, skip = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo']) {
  let lines = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) lines += sumLines(p, predicate, skip);
    else if (predicate(e.name, p)) {
      try {
        lines += fs.readFileSync(p, 'utf8').split('\n').length;
      } catch {}
    }
  }
  return lines;
}

function countDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).length;
}

// ============================================================
// Prisma Models
// ============================================================
function countPrismaModels() {
  const schema = path.join(ROOT, 'packages/db/prisma/schema.prisma');
  if (!fs.existsSync(schema)) return 0;
  const content = fs.readFileSync(schema, 'utf8');
  const matches = content.match(/^model\s+\w+\s*\{/gm);
  return matches ? matches.length : 0;
}

// ============================================================
// tRPC Procedures (粗估：掃 router 檔案中的 .query / .mutation / .subscription)
// ============================================================
function countProcedures() {
  const routersDir = path.join(ROOT, 'packages/api/src/routers');
  if (!fs.existsSync(routersDir)) return { routers: 0, procedures: 0, lines: 0 };
  let procedures = 0;
  let routers = 0;
  let lines = 0;
  for (const e of fs.readdirSync(routersDir, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.endsWith('.ts') || e.name === 'index.ts') continue;
    routers++;
    const p = path.join(routersDir, e.name);
    const content = fs.readFileSync(p, 'utf8');
    lines += content.split('\n').length;
    // 計算 .query( / .mutation( / .subscription(
    const m = content.match(/\.\s*(query|mutation|subscription)\s*\(/g);
    if (m) procedures += m.length;
  }
  return { routers, procedures, lines };
}

// ============================================================
// Pages & Route Modules
// ============================================================
function countPagesAndRoutes() {
  const localeDir = path.join(ROOT, 'apps/web/src/app/[locale]');
  if (!fs.existsSync(localeDir)) return { pages: 0, route_modules: 0 };
  const pages = countFiles(localeDir, name => name === 'page.tsx');
  const route_modules = fs.readdirSync(localeDir, { withFileTypes: true })
    .filter(e => e.isDirectory()).length;
  return { pages, route_modules };
}

// ============================================================
// Components
// ============================================================
function countComponents() {
  const uiDir = path.join(ROOT, 'apps/web/src/components/ui');
  const compDir = path.join(ROOT, 'apps/web/src/components');
  const ui_components = countFiles(uiDir, name => name.endsWith('.tsx'));
  const ui_lines = sumLines(uiDir, name => name.endsWith('.tsx'));
  const total = countFiles(compDir, name => name.endsWith('.tsx'));
  const total_lines = sumLines(compDir, name => name.endsWith('.tsx'));
  return {
    ui_components,
    ui_components_lines: ui_lines,
    business_components: total - ui_components,
    business_components_lines: total_lines - ui_lines,
  };
}

// ============================================================
// i18n keys (遞迴計算 leaf 值)
// ============================================================
function countKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 1;
  let count = 0;
  for (const v of Object.values(obj)) {
    count += countKeys(v);
  }
  return count;
}

function countI18n() {
  const zhPath = path.join(ROOT, 'apps/web/src/messages/zh-TW.json');
  if (!fs.existsSync(zhPath)) return { i18n_keys: 0, i18n_namespaces: 0 };
  try {
    const data = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
    const namespaces = Object.keys(data).length;
    const keys = countKeys(data);
    return { i18n_keys: keys, i18n_namespaces: namespaces };
  } catch {
    return { i18n_keys: 0, i18n_namespaces: 0 };
  }
}

// ============================================================
// Core Source Files
// ============================================================
function countCoreFiles() {
  // 核心源碼範圍：apps/web + packages/**（排除 dist/build/.next/node_modules）
  // 計法與 docs/codebase-analyze/SUMMARY.md 原分析對齊
  const dirs = [
    path.join(ROOT, 'apps/web'),
    path.join(ROOT, 'packages'),
  ];
  let ts = 0, tsx = 0, js = 0;
  for (const d of dirs) {
    ts += countFiles(d, n => n.endsWith('.ts'));
    tsx += countFiles(d, n => n.endsWith('.tsx'));
    js += countFiles(d, n => n.endsWith('.js'));
  }
  // scripts/ 目錄也算核心源碼
  const scriptsDir = path.join(ROOT, 'scripts');
  js += countFiles(scriptsDir, n => n.endsWith('.js'));
  ts += countFiles(scriptsDir, n => n.endsWith('.ts'));
  return { ts_files: ts, tsx_files: tsx, js_files: js, core_source_files: ts + tsx + js };
}

// ============================================================
// Scripts
// ============================================================
function countScripts() {
  const d = path.join(ROOT, 'scripts');
  return countFiles(d, n => n.endsWith('.js') || n.endsWith('.ts') || n.endsWith('.sh') || n.endsWith('.py') || n.endsWith('.ps1'));
}

// ============================================================
// Docs (.md 計數)
// ============================================================
function countDocs() {
  return countFiles(ROOT, n => n.endsWith('.md'));
}

// ============================================================
// Mermaid 圖表計數（從 09-diagrams 目錄）
// ============================================================
function countMermaid() {
  const d = path.join(ROOT, 'docs/codebase-analyze/09-diagrams');
  if (!fs.existsSync(d)) return 0;
  let count = 0;
  for (const e of fs.readdirSync(d)) {
    if (!e.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(d, e), 'utf8');
    const m = content.match(/```mermaid/g);
    if (m) count += m.length;
  }
  return count;
}

// ============================================================
// 收集全部統計
// ============================================================
function collectStats() {
  const core = countCoreFiles();
  const proc = countProcedures();
  const routes = countPagesAndRoutes();
  const comp = countComponents();
  const i18n = countI18n();

  return {
    core_source_files: core.core_source_files,
    ts_files: core.ts_files,
    tsx_files: core.tsx_files,
    js_files: core.js_files,
    prisma_models: countPrismaModels(),
    api_routers: proc.routers,
    api_procedures: proc.procedures,
    api_lines: proc.lines,
    route_modules: routes.route_modules,
    pages: routes.pages,
    business_components: comp.business_components,
    business_components_lines: comp.business_components_lines,
    ui_components: comp.ui_components,
    ui_components_lines: comp.ui_components_lines,
    i18n_keys: i18n.i18n_keys,
    i18n_namespaces: i18n.i18n_namespaces,
    scripts: countScripts(),
    mermaid_diagrams: countMermaid(),
    total_md_docs: countDocs(),
  };
}

// ============================================================
// 讀取 SUMMARY.md 當前聲稱的統計
// ============================================================
function loadClaimedStats() {
  const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
  const match = content.match(/<!--\s*\n?(machine-readable-stats:[\s\S]*?)\n?-->/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const stats = {};
  let inStats = false;
  let statsIndent = -1;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^(\s*)/)[1].length;
    const trimmed = raw.trim();
    // 偵測 stats: 開始
    if (/^stats:\s*$/.test(trimmed)) {
      inStats = true;
      statsIndent = indent;
      continue;
    }
    if (inStats) {
      // 遇到同級或更淺的 key → 結束
      if (indent <= statsIndent && /^[a-z_][a-z0-9_]*:/.test(trimmed)) {
        inStats = false;
        continue;
      }
      // 子項
      const kv = trimmed.match(/^([a-z_][a-z0-9_]*):\s*"?([^"]*?)"?\s*$/);
      if (kv) {
        const v = kv[2].trim();
        stats[kv[1]] = /^\d+$/.test(v) ? parseInt(v, 10) : v;
      }
    }
  }
  return stats;
}

// ============================================================
// 比對
// ============================================================
function diff(claimed, measured) {
  const results = [];
  for (const key of Object.keys(measured)) {
    const c = claimed[key];
    const m = measured[key];
    if (c === undefined) {
      results.push({ key, claimed: '(無)', measured: m, status: 'new' });
    } else if (c !== m) {
      const pct = c === 0 ? 100 : Math.abs(m - c) / c * 100;
      results.push({
        key, claimed: c, measured: m,
        diff: m - c,
        pct: pct.toFixed(1),
        status: pct > 10 ? 'warn' : 'info',
      });
    } else {
      results.push({ key, claimed: c, measured: m, status: 'ok' });
    }
  }
  return results;
}

// ============================================================
// 寫回 SUMMARY.md
// ============================================================
function applyStats(measured) {
  let content = fs.readFileSync(SUMMARY_PATH, 'utf8');
  const now = new Date().toISOString().split('T')[0];

  // 更新 last_refresh_date
  content = content.replace(/last_refresh_date:\s*"[^"]*"/, `last_refresh_date: "${now}"`);

  // 替換 stats 區塊
  const newStatsBlock = [
    '  stats:',
    ...Object.entries(measured).map(([k, v]) => `    ${k}: ${typeof v === 'string' ? `"${v}"` : v}`),
  ].join('\n');

  content = content.replace(
    /^(  stats:\s*\n)([\s\S]*?)(?=^  \w+:|\Z)/m,
    newStatsBlock + '\n'
  );

  fs.writeFileSync(SUMMARY_PATH, content);
}

// ============================================================
// 主流程
// ============================================================
function main() {
  console.log('📊 [refresh-stats] 掃描 codebase 中...\n');
  const measured = collectStats();
  const claimed = loadClaimedStats();
  const results = diff(claimed, measured);

  if (JSON_OUT) {
    console.log(JSON.stringify({ measured, claimed, diff: results }, null, 2));
    return;
  }

  console.log('📋 實測 vs SUMMARY.md 聲稱：');
  console.log('─'.repeat(78));
  console.log('指標'.padEnd(30) + '聲稱'.padEnd(12) + '實測'.padEnd(12) + '差異'.padEnd(10) + '狀態');
  console.log('─'.repeat(78));

  const icons = { ok: '✅', info: '🔵', warn: '⚠️ ', new: '🆕' };
  for (const r of results) {
    const diffStr = r.status === 'ok' || r.status === 'new' ? '-' : `${r.diff > 0 ? '+' : ''}${r.diff} (${r.pct}%)`;
    console.log(
      r.key.padEnd(30) +
      String(r.claimed).padEnd(12) +
      String(r.measured).padEnd(12) +
      diffStr.padEnd(10) +
      icons[r.status]
    );
  }
  console.log('─'.repeat(78));

  const warns = results.filter(r => r.status === 'warn').length;
  const infos = results.filter(r => r.status === 'info').length;
  const news = results.filter(r => r.status === 'new').length;

  console.log('');
  console.log(`總結: ✅ ${results.length - warns - infos - news} 一致 | 🔵 ${infos} 輕微 | ⚠️  ${warns} 顯著漂移 | 🆕 ${news} 新增`);

  if (APPLY) {
    applyStats(measured);
    console.log('');
    console.log(`✅ 已寫入 ${path.relative(ROOT, SUMMARY_PATH)} 的 machine-readable-stats`);
    console.log('   last_refresh_date 已更新為今日');
    console.log('');
    console.log('⚠️  注意：本腳本只更新 machine-readable-stats 數字。');
    console.log('   SUMMARY.md 的人類可讀表格、各 CLAUDE.md 的數字需要手動同步。');
    console.log('   完整重跑分析請執行：/itpm:refresh-codebase-analysis');
  } else {
    if (warns > 0 || infos > 0 || news > 0) {
      console.log('');
      console.log('💡 執行 `node scripts/refresh-stats.js --apply` 將實測值寫入 SUMMARY.md');
    }
  }
}

main();
