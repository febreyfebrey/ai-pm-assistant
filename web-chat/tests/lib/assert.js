// 極簡測試框架 — 不依賴 Jest/Mocha

export class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.results = [];
  }

  async run(name, fn) {
    const startedAt = Date.now();
    try {
      await fn();
      const duration = Date.now() - startedAt;
      this.results.push({ name, passed: true, duration });
      console.log(`  ✅ ${name} (${duration}ms)`);
      return true;
    } catch (err) {
      const duration = Date.now() - startedAt;
      this.results.push({
        name,
        passed: false,
        duration,
        error: err.message,
        stack: err.stack,
      });
      console.log(`  ❌ ${name} (${duration}ms)`);
      console.log(`     ${err.message}`);
      return false;
    }
  }

  get stats() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    return { passed, failed, total: this.results.length };
  }
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message ||
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertContains(haystack, needle, message) {
  if (typeof haystack !== 'string' || !haystack.includes(needle)) {
    throw new Error(
      message ||
        `Expected string to contain "${needle}", got "${String(haystack).slice(0, 100)}..."`
    );
  }
}

export function assertMatch(str, regex, message) {
  if (!regex.test(str)) {
    throw new Error(
      message || `Expected to match ${regex}, got "${String(str).slice(0, 100)}..."`
    );
  }
}

export function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(message || `Expected ${type}, got ${typeof value}`);
  }
}

export function assertHas(obj, key, message) {
  if (!obj || !(key in obj)) {
    throw new Error(message || `Expected object to have key "${key}"`);
  }
}

// Helper for fetch — simpler API wrapper
export async function apiRequest(path, options = {}) {
  const baseUrl = process.env.TEST_BACKEND_URL || 'http://localhost:3002';
  const res = await fetch(baseUrl + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-json response
  }
  return { status: res.status, headers: res.headers, data };
}
