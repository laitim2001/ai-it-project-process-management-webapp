#!/usr/bin/env node
/**
 * @fileoverview check-claude-md-sync.js — CLAUDE.md ↔ codebase-analyze/SUMMARY.md 數字一致性校驗
 * @usage
 *   node scripts/check-claude-md-sync.js              # 校驗模式（stderr warn，不阻斷）
 *   node scripts/check-claude-md-sync.js --strict     # 嚴格模式（發現不一致 exit 1）
 *   node scripts/check-claude-md-sync.js --write-log  # 額外寫入 docs/codebase-analyze/drift-warnings.md
 * @description
 *   方案 A — Stop hook 輕量校驗腳本
 *   1. 從 SUMMARY.md 頂部 HTML 註解讀取權威統計 (YAML)
 *   2. 掃描所有 CLAUDE.md
 *   3. 比對聲稱的數字 vs 權威數字，列出差異 > 5% 或絕對值差異 > 2 的項目
 *   4. 24 小時冷卻期（同項目不重複警告）
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================
const ROOT = path.resolve(__dirname, '..');
const SUMMARY_PATH = path.join(ROOT, 'docs/codebase-analyze/SUMMARY.md');
const DRIFT_LOG = path.join(ROOT, 'docs/codebase-analyze/drift-warnings.md');
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const DIFF_THRESHOLD_PCT = 5; // 超過 5% 警告
const DIFF_THRESHOLD_ABS = 2; // 或絕對差 > 2

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const WRITE_LOG = args.includes('--write-log');

// ============================================================
// 讀取 SUMMARY.md 的 machine-readable-stats
// ============================================================
function loadAuthoritativeStats() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    throw new Error(`SUMMARY.md not found: ${SUMMARY_PATH}`);
  }
  const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
  const match = content.match(/<!--\s*\n?(machine-readable-stats:[\s\S]*?)\n?-->/);
  if (!match) {
    throw new Error('SUMMARY.md 缺少 machine-readable-stats 區塊');
  }
  return parseStatsYaml(match[1]);
}

// 簡化版：直接用正則抓出 stats 區塊下所有 key: value
function parseStatsYaml(text) {
  const result = { stats: {}, tech_stack: {} };

  // 頂層 scalar 欄位
  const topScalars = ['version', 'last_analysis_date', 'last_refresh_date'];
  for (const key of topScalars) {
    const re = new RegExp(`^\\s*${key}:\\s*"?([^"\\n]+)"?\\s*$`, 'm');
    const m = text.match(re);
    if (m) result[key] = /^\d+$/.test(m[1].trim()) ? parseInt(m[1].trim(), 10) : m[1].trim();
  }

  // 抓 stats: 區塊下的所有縮排 key: value
  const statsMatch = text.match(/^\s*stats:\s*\n([\s\S]*?)(?=^\s*\w+:|\Z)/m);
  if (statsMatch) {
    const body = statsMatch[1];
    const kvRe = /^\s+([a-z_][a-z0-9_]*):\s*"?([^"\n]+?)"?\s*$/gm;
    let m;
    while ((m = kvRe.exec(body)) !== null) {
      const key = m[1];
      const val = m[2].trim();
      result.stats[key] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
    }
  }

  // 抓 tech_stack: 區塊
  const techMatch = text.match(/^\s*tech_stack:\s*\n([\s\S]*?)(?=^\S|\Z)/m);
  if (techMatch) {
    const body = techMatch[1];
    const kvRe = /^\s+([a-z_][a-z0-9_]*):\s*"?([^"\n]+?)"?\s*$/gm;
    let m;
    while ((m = kvRe.exec(body)) !== null) {
      result.tech_stack[m[1]] = m[2].trim();
    }
  }

  return result;
}

// ============================================================
// 掃描所有 CLAUDE.md
// ============================================================
function findAllClaudeMd(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    // 跳過不該掃的
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git' ||
        e.name === 'dist' || e.name === 'build' || e.name === '.turbo') {
      continue;
    }
    if (e.isDirectory()) {
      findAllClaudeMd(full, results);
    } else if (e.name === 'CLAUDE.md') {
      results.push(full);
    }
  }
  return results;
}

// ============================================================
// 指標提取規則
// ============================================================
// 格式：[指標名, 權威值, 語義 regex（匹配文字中出現此指標的描述）, 期望數字位置]
// 使用 negative lookbehind 避免匹配日期或其他不相關數字
function buildRules(stats) {
  const s = stats.stats;
  return [
    {
      name: 'route_modules',
      authoritative: s.route_modules,
      patterns: [
        /(\d+)\s*(?:個)?\s*(?:route\s*modules?|路由模[塊組])/gi,
        /(?:route\s*modules?|路由模[塊組])[^\d\n]{0,20}(\d+)/gi,
      ],
    },
    {
      name: 'pages',
      authoritative: s.pages,
      patterns: [
        /(\d+)\+?\s*(?:個)?\s*(?:pages?(?:\s*implemented)?|頁面)/gi,
      ],
    },
    {
      name: 'api_routers',
      authoritative: s.api_routers,
      patterns: [
        /(\d+)\s*(?:個)?\s*(?:Routers?|tRPC\s*routers?)\b/gi,
        /Routers?[^\d\n]{0,30}(\d+)\s*個/gi,
      ],
    },
    {
      name: 'api_procedures',
      authoritative: s.api_procedures,
      patterns: [
        /(\d+)\s*(?:個)?\s*Procedures?\b/gi,
        /Procedures?:?\s*\*?\*?(\d+)\*?\*?/gi,
      ],
    },
    {
      name: 'prisma_models',
      authoritative: s.prisma_models,
      patterns: [
        /(\d+)\s*(?:個)?\s*(?:Prisma\s*)?Models?\b/gi,
        /Prisma\s*Models?:?\s*\*?\*?(\d+)\*?\*?/gi,
      ],
    },
    {
      name: 'business_components',
      authoritative: s.business_components,
      patterns: [
        /(\d+)\s*(?:個)?\s*業務組件/gi,
        /business\s*components?\s*[:\-]?\s*\*?\*?(\d+)\*?\*?/gi,
      ],
    },
    {
      name: 'ui_components',
      authoritative: s.ui_components,
      patterns: [
        /(\d+)\s*(?:個)?\s*UI\s*組件/gi,
        /UI\s*Components?\s*[:\-]?\s*\*?\*?(\d+)\*?\*?/gi,
      ],
    },
    {
      name: 'i18n_keys',
      authoritative: s.i18n_keys,
      patterns: [
        /(\d[\d,]{2,})\s*(?:個)?\s*(?:i18n\s*|翻譯\s*)?keys?/gi,
      ],
    },
    {
      name: 'scripts',
      authoritative: s.scripts,
      patterns: [
        /(\d+)\s*(?:個)?\s*(?:腳本|Scripts?)\b/gi,
      ],
    },
  ];
}

// ============================================================
// 掃描單一 CLAUDE.md
// ============================================================
function scanFile(filePath, rules) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const lines = content.split('\n');

  for (const rule of rules) {
    for (const pat of rule.patterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(content)) !== null) {
        const claimed = parseInt(String(m[1]).replace(/,/g, ''), 10);
        if (isNaN(claimed)) continue;
        const auth = rule.authoritative;
        const diff = Math.abs(claimed - auth);
        const pct = auth === 0 ? 100 : (diff / auth) * 100;
        if (diff > DIFF_THRESHOLD_ABS && pct > DIFF_THRESHOLD_PCT) {
          // 找行號
          const upTo = content.substring(0, m.index);
          const lineNum = upTo.split('\n').length;
          const lineText = lines[lineNum - 1] ? lines[lineNum - 1].trim() : '';
          findings.push({
            metric: rule.name,
            claimed,
            authoritative: auth,
            diffPct: pct.toFixed(1),
            line: lineNum,
            snippet: lineText.substring(0, 120),
          });
        }
      }
    }
  }
  return findings;
}

// ============================================================
// 冷卻期管理
// ============================================================
const COOLDOWN_FILE = path.join(ROOT, '.claude/.drift-cooldown.json');

function loadCooldown() {
  if (!fs.existsSync(COOLDOWN_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCooldown(data) {
  try {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch {
    // 靜默失敗（非關鍵）
  }
}

function isInCooldown(cooldown, key) {
  if (!cooldown[key]) return false;
  return (Date.now() - cooldown[key]) < COOLDOWN_MS;
}

// ============================================================
// 主流程
// ============================================================
function main() {
  let stats;
  try {
    stats = loadAuthoritativeStats();
  } catch (err) {
    console.error(`❌ [claude-md-sync] 無法讀取權威統計: ${err.message}`);
    process.exit(STRICT ? 1 : 0);
  }

  const rules = buildRules(stats);
  const files = findAllClaudeMd(ROOT);
  const cooldown = loadCooldown();
  const allFindings = [];
  const newCooldown = { ...cooldown };

  for (const file of files) {
    const findings = scanFile(file, rules);
    for (const f of findings) {
      const key = `${path.relative(ROOT, file)}:${f.metric}:${f.claimed}`;
      if (isInCooldown(cooldown, key)) continue;
      allFindings.push({ file: path.relative(ROOT, file), ...f });
      newCooldown[key] = Date.now();
    }
  }

  if (allFindings.length === 0) {
    // 成功：安靜退出（Stop hook 友好）
    if (!args.includes('--quiet')) {
      console.log('✅ [claude-md-sync] CLAUDE.md 數字與 SUMMARY.md 一致（或在冷卻期內）');
    }
    saveCooldown(newCooldown);
    process.exit(0);
  }

  // 輸出警告到 stderr
  console.error('');
  console.error('⚠️  [claude-md-sync] 偵測到 CLAUDE.md 與權威統計 (SUMMARY.md) 不一致：');
  console.error('─'.repeat(80));
  for (const f of allFindings) {
    console.error(`📄 ${f.file}:${f.line}`);
    console.error(`   指標: ${f.metric}`);
    console.error(`   CLAUDE.md 聲稱: ${f.claimed}  |  SUMMARY.md 權威: ${f.authoritative}  (差 ${f.diffPct}%)`);
    console.error(`   原文: "${f.snippet}"`);
    console.error('');
  }
  console.error('💡 修正建議：');
  console.error('   - 若 SUMMARY.md 是對的 → 更新 CLAUDE.md 相關數字');
  console.error('   - 若 CLAUDE.md 是對的（可能 codebase 已演進）→ 執行 /itpm:refresh-stats 更新 SUMMARY.md');
  console.error('   - 24 小時內不會重複警告同一指標');
  console.error('─'.repeat(80));

  if (WRITE_LOG) {
    writeDriftLog(allFindings);
  }

  saveCooldown(newCooldown);
  process.exit(STRICT ? 1 : 0);
}

function writeDriftLog(findings) {
  const now = new Date().toISOString();
  const lines = [
    `# CLAUDE.md 漂移警告記錄`,
    ``,
    `> **最後更新**: ${now}`,
    `> **權威來源**: docs/codebase-analyze/SUMMARY.md`,
    `> 此檔案由 \`scripts/check-claude-md-sync.js\` 自動產生，手動編輯會在下次執行時被覆蓋。`,
    ``,
    `## 當前漂移項目`,
    ``,
    '| 檔案 | 行號 | 指標 | CLAUDE.md | SUMMARY.md | 差距 |',
    '|------|------|------|-----------|------------|------|',
  ];
  for (const f of findings) {
    lines.push(`| ${f.file} | ${f.line} | ${f.metric} | ${f.claimed} | ${f.authoritative} | ${f.diffPct}% |`);
  }
  lines.push('', '## 處理建議', '');
  lines.push('- 若 SUMMARY.md 過期 → 執行 `/itpm:refresh-stats`');
  lines.push('- 若 CLAUDE.md 過期 → 手動更新各 CLAUDE.md 或用 `/itpm:refresh-stats --sync-claude`');
  lines.push('');
  fs.writeFileSync(DRIFT_LOG, lines.join('\n'));
}

main();
