#!/usr/bin/env node
/**
 * @fileoverview snapshot-analysis.js — 為 codebase-analyze 目錄建立 / 比對快照
 * @usage
 *   node scripts/snapshot-analysis.js save <name>     # 建立快照（複製到 .snapshots/<name>/）
 *   node scripts/snapshot-analysis.js diff <a> <b>    # 比對兩個快照
 *   node scripts/snapshot-analysis.js list            # 列出所有快照
 * @description
 *   方案 B.2 輔助工具 — 在重跑完整分析前後建立快照，自動產生 diff 報告
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANALYZE_DIR = path.join(ROOT, 'docs/codebase-analyze');
const SNAPSHOT_DIR = path.join(ROOT, '.claude/.analysis-snapshots');

const [, , cmd, arg1, arg2] = process.argv;

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === '.snapshots' || e.name === '.git') continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function listMdFiles(dir, prefix = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = prefix ? path.join(prefix, e.name) : e.name;
    if (e.isDirectory()) results.push(...listMdFiles(p, rel));
    else if (e.name.endsWith('.md')) {
      const stat = fs.statSync(p);
      const content = fs.readFileSync(p, 'utf8');
      results.push({
        path: rel.replace(/\\/g, '/'),
        lines: content.split('\n').length,
        bytes: stat.size,
      });
    }
  }
  return results;
}

// ============================================================
// save
// ============================================================
function save(name) {
  if (!name) { console.error('用法: save <name>'); process.exit(1); }
  ensureDir(SNAPSHOT_DIR);
  const target = path.join(SNAPSHOT_DIR, name);
  if (fs.existsSync(target)) {
    console.error(`❌ 快照已存在: ${name}`);
    process.exit(1);
  }
  copyDir(ANALYZE_DIR, target);
  const meta = {
    name,
    created_at: new Date().toISOString(),
    files: listMdFiles(target),
  };
  fs.writeFileSync(path.join(target, '.meta.json'), JSON.stringify(meta, null, 2));
  console.log(`✅ 快照已建立: ${path.relative(ROOT, target)}`);
  console.log(`   檔案數: ${meta.files.length}`);
}

// ============================================================
// list
// ============================================================
function list() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.log('(無快照)');
    return;
  }
  const items = fs.readdirSync(SNAPSHOT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const metaPath = path.join(SNAPSHOT_DIR, e.name, '.meta.json');
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }
      return { name: e.name, created_at: '(unknown)', files: [] };
    });
  console.log('可用快照：');
  for (const m of items) {
    console.log(`  - ${m.name.padEnd(30)} ${m.created_at.substring(0, 10)}  (${m.files.length} 檔)`);
  }
}

// ============================================================
// diff
// ============================================================
function diff(a, b) {
  if (!a || !b) { console.error('用法: diff <a> <b>'); process.exit(1); }
  const pA = path.join(SNAPSHOT_DIR, a);
  const pB = b === 'current' ? ANALYZE_DIR : path.join(SNAPSHOT_DIR, b);
  if (!fs.existsSync(pA)) { console.error(`❌ 找不到快照: ${a}`); process.exit(1); }
  if (!fs.existsSync(pB)) { console.error(`❌ 找不到快照: ${b}`); process.exit(1); }

  const filesA = new Map(listMdFiles(pA).map(f => [f.path, f]));
  const filesB = new Map(listMdFiles(pB).map(f => [f.path, f]));

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  for (const [p, f] of filesB) {
    if (!filesA.has(p)) {
      added.push(f);
    } else {
      const oldF = filesA.get(p);
      const lineDiff = f.lines - oldF.lines;
      if (Math.abs(lineDiff) > 5 || Math.abs(f.bytes - oldF.bytes) > 200) {
        changed.push({ path: p, oldLines: oldF.lines, newLines: f.lines, lineDiff });
      } else {
        unchanged.push(p);
      }
    }
  }
  for (const [p, f] of filesA) {
    if (!filesB.has(p)) removed.push(f);
  }

  console.log(`\n📊 快照比對: ${a} → ${b}\n` + '─'.repeat(70));
  console.log(`✅ 未變更: ${unchanged.length}`);
  console.log(`🆕 新增 (${added.length}):`);
  for (const f of added) console.log(`   + ${f.path}  (${f.lines} 行)`);
  console.log(`🗑️  刪除 (${removed.length}):`);
  for (const f of removed) console.log(`   - ${f.path}  (${f.lines} 行)`);
  console.log(`✏️  變更 (${changed.length}):`);
  for (const c of changed) {
    const sign = c.lineDiff > 0 ? '+' : '';
    console.log(`   ~ ${c.path}  (${c.oldLines} → ${c.newLines} 行, ${sign}${c.lineDiff})`);
  }
  console.log('─'.repeat(70));

  return { added, removed, changed, unchanged };
}

// ============================================================
// 主入口
// ============================================================
switch (cmd) {
  case 'save': save(arg1); break;
  case 'list': list(); break;
  case 'diff': diff(arg1, arg2 || 'current'); break;
  default:
    console.log('用法:');
    console.log('  node scripts/snapshot-analysis.js save <name>');
    console.log('  node scripts/snapshot-analysis.js diff <a> <b|current>');
    console.log('  node scripts/snapshot-analysis.js list');
    process.exit(1);
}
