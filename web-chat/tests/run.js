#!/usr/bin/env node
// 自動化測試主執行器
//
// 用法：
//   node tests/run.js           # 跑全部測試
//   node tests/run.js --skip-api # 跳過會呼叫 Claude API 的測試（省錢）
//   node tests/run.js --notify   # 測完送 Teams 通知

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const SKIP_API = args.includes('--skip-api');
const NOTIFY = args.includes('--notify');

console.log('');
console.log('🧪 AI PM Assistant — Automated Test Runner');
console.log(`   Backend: ${process.env.TEST_BACKEND_URL || 'http://localhost:3002'}`);
console.log(`   Mode: ${SKIP_API ? 'structural only (no API calls)' : 'full (with Claude API)'}`);
console.log('');

const allResults = [];
const startedAt = Date.now();

// --- 執行測試 cases ---
const caseFiles = [
  { file: '01-backend.js', requiresApi: false },
  { file: '03-structure.js', requiresApi: false },
  { file: '02-conversation.js', requiresApi: true },
  { file: '04-attachment.js', requiresApi: true },
];

for (const { file, requiresApi } of caseFiles) {
  if (SKIP_API && requiresApi) {
    console.log(`\n⏭️  Skip ${file}（需要 Claude API）`);
    continue;
  }
  try {
    const mod = await import(`./cases/${file}`);
    const results = await mod.runTests();
    allResults.push(...results);
  } catch (err) {
    console.error(`\n💥 ${file} 無法執行：${err.message}`);
    allResults.push({
      name: `LOAD_FAILED: ${file}`,
      passed: false,
      duration: 0,
      error: err.message,
    });
  }
}

// --- 產出報告 ---
const duration = Date.now() - startedAt;
const passed = allResults.filter(r => r.passed).length;
const failed = allResults.filter(r => !r.passed).length;
const total = allResults.length;

const summary = {
  passed,
  failed,
  total,
  passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  duration,
  timestamp: new Date().toISOString(),
};

console.log('');
console.log('═══════════════════════════════════════');
console.log(`📊 Summary: ${passed}/${total} passed (${summary.passRate}%)  ⏱ ${duration}ms`);
console.log('═══════════════════════════════════════');

if (failed > 0) {
  console.log('\n❌ Failed tests:');
  for (const r of allResults.filter(r => !r.passed)) {
    console.log(`   • ${r.name}`);
    console.log(`     ${r.error}`);
  }
}

// --- 寫入 markdown 報告 ---
const reportPath = path.join(__dirname, 'REPORT.md');
const reportLines = [
  `# 測試報告`,
  ``,
  `**時間**: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
  `**模式**: ${SKIP_API ? 'Structural Only' : 'Full (with Claude API)'}`,
  `**結果**: ${passed}/${total} 通過 (${summary.passRate}%)`,
  `**耗時**: ${duration}ms`,
  ``,
  `## 詳細結果`,
  ``,
  `| # | 測試項目 | 結果 | 耗時 | 錯誤 |`,
  `|---|---------|------|------|------|`,
];

allResults.forEach((r, i) => {
  const icon = r.passed ? '✅' : '❌';
  const err = r.error ? r.error.replace(/\|/g, '\\|').slice(0, 80) : '';
  reportLines.push(`| ${i + 1} | ${r.name} | ${icon} | ${r.duration}ms | ${err} |`);
});

if (failed > 0) {
  reportLines.push(``, `## 失敗細節`, ``);
  for (const r of allResults.filter(r => !r.passed)) {
    reportLines.push(`### ❌ ${r.name}`);
    reportLines.push(``);
    reportLines.push('```');
    reportLines.push(r.error);
    reportLines.push('```');
    reportLines.push(``);
  }
}

if (passed === total) {
  reportLines.push(``, `---`, ``, `## ✅ 全部通過！`, ``);
  reportLines.push(`可以進行人工測試，建議檢查：`);
  reportLines.push(``);
  reportLines.push(`1. **訪談流程完整性** — 開一張完整的需求單，確認 Q0→Q7 流程自然`);
  reportLines.push(`2. **工單預覽卡** — 確認欄位填充正確、排版好看`);
  reportLines.push(`3. **Wireframe 產生** — 提 UI 類需求，確認 iframe 正確渲染`);
  reportLines.push(`4. **圖片 Inline** — 測試 \`(圖一)(圖二)\` 標記渲染`);
  reportLines.push(`5. **Lightbox** — 點圖片能放大預覽`);
  reportLines.push(`6. **深色/淺色切換** — 左下角主題按鈕`);
  reportLines.push(`7. **對話持久化** — 重整後對話列表還在`);
  reportLines.push(`8. **手機 RWD** — DevTools 切到手機模式看看`);
}

fs.writeFileSync(reportPath, reportLines.join('\n'));
console.log(`\n📝 Report: ${reportPath}`);

// --- Teams 通知（選用） ---
if (NOTIFY && process.env.TEAMS_WEBHOOK_URL) {
  try {
    const { sendTeamsNotification } = await import('./notify.js');
    await sendTeamsNotification(summary, allResults);
    console.log('📨 已送 Teams 通知');
  } catch (err) {
    console.error('⚠️  Teams 通知失敗：', err.message);
  }
}

// --- Exit code ---
process.exit(failed > 0 ? 1 : 0);
