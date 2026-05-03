// Teams Webhook 通知
//
// 環境變數：TEAMS_WEBHOOK_URL = https://yourorg.webhook.office.com/...

export async function sendTeamsNotification(summary, results) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('TEAMS_WEBHOOK_URL 未設定');
  }

  const allPassed = summary.failed === 0;
  const themeColor = allPassed ? '00C851' : 'FF4444';
  const title = allPassed
    ? '✅ Web Chat 自動化測試全部通過'
    : `❌ Web Chat 測試失敗 ${summary.failed}/${summary.total}`;

  const facts = [
    { name: '通過率', value: `${summary.passed}/${summary.total} (${summary.passRate}%)` },
    { name: '耗時', value: `${summary.duration}ms` },
    { name: '時間', value: new Date(summary.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) },
  ];

  const failedItems = results.filter(r => !r.passed);
  const text = allPassed
    ? '🎉 所有測試項目通過，可以開始人工測試了！\n\n建議重點：訪談流程、Wireframe、圖片 Inline、工單預覽'
    : '⚠️ 以下項目失敗，請先修正：\n\n' +
      failedItems.map(r => `- **${r.name}**: ${r.error}`).join('\n');

  const payload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor,
    summary: title,
    title,
    sections: [
      {
        facts,
        text,
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Webhook 回傳 ${res.status}`);
  }
}
