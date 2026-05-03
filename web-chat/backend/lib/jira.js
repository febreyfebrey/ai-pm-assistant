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

// =====================================================
// Issue creation / mutation
// =====================================================

/**
 * Create a Jira issue.
 * @param {Object} fields - Jira fields object (project, issuetype, summary, description ADF, priority, etc.)
 * @returns {Promise<{key: string, id: string, self: string}>}
 */
export async function createIssue(fields) {
  const { baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`createIssue ${res.status}: ${errText.slice(0, 500)}`);
  }
  return res.json();
}

/**
 * Upload an attachment to an issue.
 * Jira requires `X-Atlassian-Token: no-check` header on this endpoint.
 *
 * @param {string} issueKey - e.g. "RDC-9999"
 * @param {{filename: string, buffer: Buffer, contentType: string}} file
 * @returns {Promise<Array<{id: string, filename: string, content: string}>>}
 */
export async function addAttachment(issueKey, file) {
  const { baseUrl } = getConfig();
  const form = new FormData();
  // Node's built-in FormData accepts Blob; convert Buffer → Blob
  const blob = new Blob([file.buffer], { type: file.contentType || 'application/octet-stream' });
  form.append('file', blob, file.filename);

  const res = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check',
    },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`addAttachment ${res.status}: ${errText.slice(0, 500)}`);
  }
  return res.json();
}

/**
 * Replace the description of an existing issue with a new ADF document.
 * @param {string} issueKey
 * @param {Object} descriptionADF - ADF doc `{ type: 'doc', version: 1, content: [...] }`
 */
export async function patchDescription(issueKey, descriptionADF) {
  const { baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { description: descriptionADF } }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`patchDescription ${res.status}: ${errText.slice(0, 500)}`);
  }
  // PUT returns 204 No Content on success
  return { ok: true };
}
