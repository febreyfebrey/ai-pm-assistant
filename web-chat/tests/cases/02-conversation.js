// TC-02: 對話基本流程（Smoke 測試 — 會呼叫真實 Claude API）

import {
  TestRunner,
  assert,
  assertEquals,
  assertContains,
  assertHas,
  apiRequest,
} from '../lib/assert.js';

export async function runTests() {
  const t = new TestRunner('Conversation Flow (Smoke)');
  console.log(`\n💬 ${t.suiteName}`);

  let convId = null;

  await t.run('TC-02-01 送純文字訊息 → 200 + AI 回覆', async () => {
    const r = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: 'hello' },
    });
    assertEquals(r.status, 200);
    assertHas(r.data, 'conversationId');
    assertHas(r.data, 'message');
    assert(r.data.message.length > 0, 'AI 回覆不該為空');
    convId = r.data.conversationId;
  });

  await t.run('TC-02-02 同一 conversationId 送第二則 → AI 記得上下文', async () => {
    // 先問一個可記的事
    const r1 = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        message: '我叫 Test User，請記住我的名字',
        conversationId: convId,
      },
    });
    assertEquals(r1.status, 200);

    // 再問 AI 記不記得
    const r2 = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        message: '我叫什麼？',
        conversationId: convId,
      },
    });
    assertEquals(r2.status, 200);
    // AI 應該提到 "Test User"
    const text = (r2.data.message || '').toLowerCase();
    assert(
      text.includes('test user') || text.includes('你叫'),
      `AI 應記得名字，實際回覆：${r2.data.message?.slice(0, 100)}`
    );
  });

  await t.run('TC-02-03 說「我要開需求單」→ AI 詢問提案人', async () => {
    const r = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: '我要開需求單' },
    });
    assertEquals(r.status, 200);
    const text = r.data.message || '';
    // 應該問提案人
    assert(
      text.includes('提案人') || text.includes('名字') || text.includes('誰'),
      `AI 應引導問提案人，實際：${text.slice(0, 100)}`
    );
  });

  await t.run('TC-02-04 Reporter 驗證：不存在的名字應被拒絕', async () => {
    // 先開啟訪談
    const r1 = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: '我要開需求單' },
    });
    const cid = r1.data.conversationId;

    // 輸入虛構名字（不在清單內）
    const r2 = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: 'ZZZFakeNobody_測試用', conversationId: cid },
    });
    assertEquals(r2.status, 200);
    const text = r2.data.message || '';
    // AI 應該拒絕或說找不到
    const rejected =
      text.includes('不在') ||
      text.includes('找不到') ||
      text.includes('沒有') ||
      text.includes('權限') ||
      text.includes('再確認') ||
      text.includes('打對');
    assert(
      rejected,
      `AI 應拒絕不存在的名字，實際：${text.slice(0, 200)}`
    );
    // 不該進到下一題
    const advancedToNext =
      text.includes('想解決什麼問題') ||
      text.includes('做什麼功能') ||
      text.includes('背景');
    assert(
      !advancedToNext,
      `AI 不該跳到下一題，實際：${text.slice(0, 200)}`
    );
  });

  await t.run('TC-02-05 Reporter 驗證：有效名字應被接受', async () => {
    const r1 = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: '我要開需求單' },
    });
    const cid = r1.data.conversationId;

    // Febrey 是真實存在的 reporter
    const r2 = await apiRequest('/api/chat', {
      method: 'POST',
      body: { message: 'Febrey', conversationId: cid },
    });
    assertEquals(r2.status, 200);
    const text = r2.data.message || '';
    // 應該確認或接受
    const accepted =
      text.includes('Febrey') ||
      text.includes('找到') ||
      text.includes('確認') ||
      text.includes('對嗎');
    assert(
      accepted,
      `有效名字應被接受，實際：${text.slice(0, 200)}`
    );
  });

  return t.results;
}
