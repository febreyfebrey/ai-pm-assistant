// TC-01: Backend 基礎 API 測試

import {
  TestRunner,
  assert,
  assertEquals,
  assertHas,
  assertType,
  apiRequest,
} from '../lib/assert.js';

export async function runTests() {
  const t = new TestRunner('Backend API');
  console.log(`\n📦 ${t.suiteName}`);

  await t.run('TC-01-01 GET /api/health 回傳 200 + 正確 shape', async () => {
    const r = await apiRequest('/api/health');
    assertEquals(r.status, 200, 'health 應 200');
    assertHas(r.data, 'status');
    assertEquals(r.data.status, 'ok');
    assertHas(r.data, 'model');
    assertHas(r.data, 'conversations');
    assertHas(r.data, 'uptime');
  });

  await t.run('TC-01-02 POST /api/chat 空 body → 400', async () => {
    const r = await apiRequest('/api/chat', { method: 'POST', body: {} });
    assertEquals(r.status, 400);
    assertHas(r.data, 'error');
  });

  await t.run('TC-01-03 POST /api/chat 無 message 無 attachments → 400', async () => {
    const r = await apiRequest('/api/chat', {
      method: 'POST',
      body: { conversationId: 'test-only' },
    });
    assertEquals(r.status, 400);
  });

  await t.run('TC-01-04 POST /api/reset 正常', async () => {
    const r = await apiRequest('/api/reset', {
      method: 'POST',
      body: { conversationId: 'test-reset' },
    });
    assertEquals(r.status, 200);
    assertEquals(r.data.ok, true);
  });

  await t.run('TC-01-05 CORS 允許設定的 origin', async () => {
    const r = await apiRequest('/api/health');
    const corsHeader = r.headers.get('access-control-allow-origin');
    assert(
      corsHeader === 'http://localhost:3000' || corsHeader === '*',
      `CORS header 應為 http://localhost:3000，實際：${corsHeader}`
    );
  });

  return t.results;
}
