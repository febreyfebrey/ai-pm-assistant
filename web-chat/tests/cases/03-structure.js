// TC-04 + TC-05 + TC-06 + TC-07: 結構性測試（不呼叫 API）

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  TestRunner,
  assert,
  assertContains,
  assertMatch,
} from '../lib/assert.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

export async function runTests() {
  const t = new TestRunner('Structural Tests');
  console.log(`\n🏗️  ${t.suiteName}`);

  // TC-04: Tools
  await t.run('TC-04-01 Backend 定義 generate_ticket_preview tool', async () => {
    const code = readFile('backend/server.js');
    assertContains(code, 'generate_ticket_preview', 'tool name 必須存在');
    assertContains(code, "name: 'generate_ticket_preview'");
  });

  await t.run('TC-04-02 Backend 定義 generate_wireframe tool', async () => {
    const code = readFile('backend/server.js');
    assertContains(code, 'generate_wireframe');
    assertContains(code, "name: 'generate_wireframe'");
  });

  await t.run('TC-04-03 ticket_preview tool 有所有必填欄位', async () => {
    const code = readFile('backend/server.js');
    const required = ['type', 'summary', 'priority', 'component', 'reporter', 'description'];
    for (const field of required) {
      assertContains(code, field, `必填欄位 ${field} 不在 tool schema`);
    }
  });

  // TC-05: System prompt loading
  await t.run('TC-05-01 載入 interviewer.md', async () => {
    const interviewer = readFile('../.claude/agents/interviewer.md');
    assert(interviewer.length > 500, 'interviewer.md 太短');
  });

  await t.run('TC-05-02 載入 intake-interview skill', async () => {
    const skill = readFile('../.claude/skills/intake-interview/SKILL.md');
    assertContains(skill, 'Q0', '應含 Q0 提案人');
    assertContains(skill, '提案人');
  });

  await t.run('TC-05-03 載入 tutorabc-context', async () => {
    const ctx = readFile('../.claude/rules/tutorabc-context.md');
    assertContains(ctx, 'Prefix', '應含 Prefix 對照');
    assertContains(ctx, 'Component', '應含 Component 對照');
  });

  await t.run('TC-05-04 System prompt 總長度合理', async () => {
    const all =
      readFile('../.claude/agents/interviewer.md') +
      readFile('../.claude/skills/intake-interview/SKILL.md') +
      readFile('../.claude/rules/tutorabc-context.md');
    assert(all.length > 5000, `System prompt 太短：${all.length} 字元`);
    assert(all.length < 100000, `System prompt 太長：${all.length} 字元`);
  });

  // TC-06: 前端檔案
  await t.run('TC-06-01 index.html 有 title', async () => {
    const html = readFile('index.html');
    assertContains(html, '<title>AI PM Assistant</title>');
  });

  await t.run('TC-06-02 style.css 存在', async () => {
    const css = readFile('style.css');
    assert(css.length > 1000, 'style.css 太小');
  });

  await t.run('TC-06-03 app.js 存在', async () => {
    const js = readFile('app.js');
    assert(js.length > 1000, 'app.js 太小');
  });

  await t.run('TC-06-04 app.js 語法正確', async () => {
    try {
      execSync(`node --check "${path.join(ROOT, 'app.js')}"`, { stdio: 'pipe' });
    } catch (err) {
      throw new Error(`Syntax error: ${err.stderr?.toString() || err.message}`);
    }
  });

  // TC-07: 環境設定
  await t.run('TC-07-01 .env 有 ANTHROPIC_API_KEY', async () => {
    const env = readFile('backend/.env');
    assertMatch(env, /ANTHROPIC_API_KEY=sk-ant-/, 'key 格式錯誤');
  });

  await t.run('TC-07-02 .env 有 PORT 設定', async () => {
    const env = readFile('backend/.env');
    assertContains(env, 'PORT=');
  });

  await t.run('TC-07-03 .env 有 ALLOWED_ORIGIN', async () => {
    const env = readFile('backend/.env');
    assertContains(env, 'ALLOWED_ORIGIN=');
  });

  return t.results;
}
