// Markdown → ADF converter
//
// 底層用 md-to-adf (npm)，自寫補強三個它不支援的關鍵格式：
//   1. Table       (GFM `| col |`)
//   2. Image       (自訂 [[IMG:filename]] placeholder，要 attachment id)
//   3. Task list   (`- [ ]` / `- [x]`)
//
// Pipeline：tokenize → route per segment → assemble。
// 詳見 .claude/docs/visual-elicitation-spec.md §5.2

import translator from 'md-to-adf';
import { randomUUID } from 'crypto';

/**
 * Convert markdown to ADF document.
 *
 * @param {string} markdown - Source markdown text
 * @param {Object<string, string>} [attachmentMap] - Map from filename to Jira attachment id.
 *   When [[IMG:filename]] is encountered, looks up the id here. If filename is missing
 *   from map, emits a placeholder paragraph (caller should patch later).
 * @returns {Object} ADF document `{ type: 'doc', version: 1, content: [...] }`
 */
export function convert(markdown, attachmentMap = {}) {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return { type: 'doc', version: 1, content: [] };
  }

  const segments = tokenize(markdown);
  const adfNodes = [];

  for (const seg of segments) {
    if (seg.type === 'TABLE') {
      adfNodes.push(parseTable(seg.lines));
    } else if (seg.type === 'IMAGE') {
      adfNodes.push(parseImage(seg.filename, attachmentMap));
    } else if (seg.type === 'TASK_LIST') {
      adfNodes.push(parseTaskList(seg.lines));
    } else if (seg.type === 'MARKDOWN') {
      // md-to-adf returns an adf-builder Document instance, not plain JSON.
      // Normalize via JSON round-trip so .content becomes a real array.
      const doc = JSON.parse(JSON.stringify(translator(seg.text)));
      if (Array.isArray(doc?.content)) adfNodes.push(...doc.content);
    }
  }

  return { type: 'doc', version: 1, content: adfNodes };
}

/**
 * Find unique [[IMG:filename]] placeholders in markdown, in order of first occurrence.
 * Useful for callers that need to know which attachments to upload before conversion.
 *
 * @param {string} markdown
 * @returns {string[]} unique filenames
 */
export function findImagePlaceholders(markdown) {
  if (typeof markdown !== 'string') return [];
  const re = /\[\[IMG:([^\]]+)\]\]/g;
  const found = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const fn = m[1].trim();
    if (!seen.has(fn)) {
      seen.add(fn);
      found.push(fn);
    }
  }
  return found;
}

// ─────────────────────────────────────────────
// Tokenizer
// ─────────────────────────────────────────────

const RE_IMG_LINE = /^\s*\[\[IMG:([^\]]+)\]\]\s*$/;
const RE_TASK_ITEM = /^\s*-\s+\[[xX ]\]/;
const RE_TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;

function tokenize(markdown) {
  const lines = markdown.split('\n');
  const segments = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // IMAGE: a line with only [[IMG:filename]]
    const imgMatch = line.match(RE_IMG_LINE);
    if (imgMatch) {
      segments.push({ type: 'IMAGE', filename: imgMatch[1].trim() });
      i++;
      continue;
    }

    // TASK_LIST: contiguous lines starting with "- [ ]" or "- [x]"
    if (RE_TASK_ITEM.test(line)) {
      const taskLines = [];
      while (i < lines.length && RE_TASK_ITEM.test(lines[i])) {
        taskLines.push(lines[i]);
        i++;
      }
      segments.push({ type: 'TASK_LIST', lines: taskLines });
      continue;
    }

    // TABLE: header row + separator row "|---|---|"
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      RE_TABLE_SEPARATOR.test(lines[i + 1])
    ) {
      const tableLines = [lines[i], lines[i + 1]];
      i += 2;
      while (
        i < lines.length &&
        lines[i].includes('|') &&
        lines[i].trim() !== ''
      ) {
        tableLines.push(lines[i]);
        i++;
      }
      segments.push({ type: 'TABLE', lines: tableLines });
      continue;
    }

    // MARKDOWN: accumulate until next special segment
    const mdLines = [];
    while (i < lines.length) {
      const cur = lines[i];
      if (RE_IMG_LINE.test(cur)) break;
      if (RE_TASK_ITEM.test(cur)) break;
      if (
        cur.includes('|') &&
        i + 1 < lines.length &&
        RE_TABLE_SEPARATOR.test(lines[i + 1])
      ) break;
      mdLines.push(cur);
      i++;
    }
    if (mdLines.length > 0 && mdLines.join('\n').trim() !== '') {
      segments.push({ type: 'MARKDOWN', text: mdLines.join('\n') });
    }
  }

  return segments;
}

// ─────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────

function parseTable(lines) {
  const parseRow = (line) =>
    line
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map(c => c.trim());

  const headerCells = parseRow(lines[0]);
  const dataRows = lines.slice(2).map(parseRow);

  const cellNode = (text, isHeader) => ({
    type: isHeader ? 'tableHeader' : 'tableCell',
    content: [{
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    }],
  });

  const headerRow = {
    type: 'tableRow',
    content: headerCells.map(c => cellNode(c, true)),
  };

  const bodyRows = dataRows.map(cells => ({
    type: 'tableRow',
    content: cells.map(c => cellNode(c, false)),
  }));

  return {
    type: 'table',
    attrs: { isNumberColumnEnabled: false, layout: 'default' },
    content: [headerRow, ...bodyRows],
  };
}

function parseImage(filename, attachmentMap) {
  const id = attachmentMap[filename];
  if (!id) {
    // No attachment id yet — emit a visible placeholder paragraph.
    // Caller should call patchDescription later after upload.
    return {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: `[[IMG:${filename} — pending attachment]]`,
      }],
    };
  }
  return {
    type: 'mediaSingle',
    attrs: { layout: 'center', width: 60 },
    content: [{
      type: 'media',
      attrs: { type: 'file', id, collection: '' },
    }],
  };
}

function parseTaskList(lines) {
  const items = lines.map(line => {
    const m = line.match(/^\s*-\s+\[([xX ])\]\s*(.*)$/);
    const state = m && m[1].toLowerCase() === 'x' ? 'DONE' : 'TODO';
    const text = m ? m[2] : line;
    return {
      type: 'taskItem',
      attrs: { localId: randomUUID(), state },
      content: text ? [{ type: 'text', text }] : [],
    };
  });

  return {
    type: 'taskList',
    attrs: { localId: randomUUID() },
    content: items,
  };
}
