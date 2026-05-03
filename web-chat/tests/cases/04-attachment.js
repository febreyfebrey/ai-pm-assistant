// TC-03: 附件處理測試（Smoke — 會呼叫 Claude API）

import {
  TestRunner,
  assert,
  assertEquals,
  assertHas,
  apiRequest,
} from '../lib/assert.js';

// 1x1 透明 PNG，base64 最小合法圖片
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';

export async function runTests() {
  const t = new TestRunner('Attachment Handling');
  console.log(`\n📎 ${t.suiteName}`);

  await t.run('TC-03-01 附帶 image/png → 200 接受', async () => {
    const r = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        message: '這張圖片是什麼顏色？',
        attachments: [
          {
            name: 'test.png',
            mediaType: 'image/png',
            data: TINY_PNG,
          },
        ],
      },
    });
    assertEquals(r.status, 200, `應 200，實際 ${r.status}: ${JSON.stringify(r.data)?.slice(0,200)}`);
    assertHas(r.data, 'message');
  });

  await t.run('TC-03-03 空 message + 有 attachments → 200', async () => {
    const r = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        message: '',
        attachments: [
          {
            name: 'test.png',
            mediaType: 'image/png',
            data: TINY_PNG,
          },
        ],
      },
    });
    assertEquals(r.status, 200);
  });

  return t.results;
}
