// Jira API helper — 撈 group 成員名單
//
// 用 Jira Cloud REST API v3
// Auth: Basic (email + API token)
// Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-groups/

// 注意：env vars 必須 lazy 讀取（因為 dotenv.config() 在 import 之後才執行）
function getConfig() {
  return {
    baseUrl: process.env.JIRA_BASE_URL || 'https://tutorabc-org.atlassian.net',
    email: process.env.JIRA_EMAIL,
    token: process.env.JIRA_API_TOKEN,
  };
}

function authHeader() {
  const { email, token } = getConfig();
  if (!email || !token) {
    throw new Error('Jira 認證未設定：請在 .env 設定 JIRA_EMAIL 和 JIRA_API_TOKEN');
  }
  const creds = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${creds}`;
}

/**
 * 取得某個 group 的所有成員（自動處理分頁）
 * @param {string} groupName - e.g. "jira-users-rdmembers"
 * @returns {Promise<Array<{accountId, displayName, emailAddress, active}>>}
 */
export async function fetchGroupMembers(groupName) {
  const members = [];
  let startAt = 0;
  const maxResults = 50;
  const { baseUrl } = getConfig();

  while (true) {
    const url = new URL(`${baseUrl}/rest/api/3/group/member`);
    url.searchParams.set('groupname', groupName);
    url.searchParams.set('includeInactiveUsers', 'false');
    url.searchParams.set('startAt', String(startAt));
    url.searchParams.set('maxResults', String(maxResults));

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader(),
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Jira API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    members.push(...(data.values || []));

    if (data.isLast || !data.values || data.values.length < maxResults) break;
    startAt += maxResults;

    // 保險：避免無限迴圈
    if (startAt > 10000) break;
  }

  return members;
}

/**
 * 從多個 group 撈 member 並合併去重
 * @param {string[]} groupNames
 * @returns {Promise<Array<{accountId, displayName, email, groups: string[]}>>}
 */
export async function fetchMergedGroupMembers(groupNames) {
  const byAccountId = new Map();

  for (const groupName of groupNames) {
    try {
      const members = await fetchGroupMembers(groupName);
      for (const m of members) {
        if (!m.accountId) continue;
        const existing = byAccountId.get(m.accountId);
        if (existing) {
          existing.groups.push(groupName);
        } else {
          byAccountId.set(m.accountId, {
            accountId: m.accountId,
            displayName: m.displayName,
            email: m.emailAddress || null,
            active: m.active !== false,
            groups: [groupName],
          });
        }
      }
    } catch (err) {
      console.error(`❌ 撈 group "${groupName}" 失敗：${err.message}`);
      throw err;
    }
  }

  return [...byAccountId.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'zh-Hant')
  );
}

export function hasJiraCreds() {
  const { email, token } = getConfig();
  return !!(email && token);
}
