#!/usr/bin/env node
'use strict';
/*
 * Stop hook — trial-and-error exit gate.
 *
 * Objective delegation trigger that does not depend on the model's (unreliable)
 * self-assessment of whether it is stuck. If the working log accumulates >= 3
 * failed attempts with no resolution marker, the stop is blocked and delegation
 * is forced. The hook never inspects the problem's content — it only counts an
 * objective, domain-agnostic proxy. Fail-open on any error (exit 0).
 *
 * Cross-platform: Node has the same name on win/mac/linux and is UTF-8 native.
 */

const fs = require('fs');
const path = require('path');

const THRESHOLD = 3; // failed attempts before delegation is forced
const LOG_NAMES = ['trial-and-error.md', '시행착오.md'];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw) return process.exit(0);

    let payload;
    // Strip a leading BOM (U+FEFF) if a caller or shell pipe prepended one.
    const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    try { payload = JSON.parse(clean); } catch { return process.exit(0); }
    const cwd = payload && payload.cwd;
    if (!cwd) return process.exit(0);

    let logPath = null;
    for (const name of LOG_NAMES) {
      const p = path.join(cwd, name);
      if (fs.existsSync(p)) { logPath = p; break; }
    }
    if (!logPath) return process.exit(0);

    let content = '';
    try { content = fs.readFileSync(logPath, 'utf8'); } catch { return process.exit(0); }
    if (!content) return process.exit(0);

    // Exit-allow markers — only at the start of a line (markdown prefixes ok),
    // so they cannot be matched accidentally inside prose.
    const allow = /^[#>\-*\s]*(RESOLVED|DELEGATED|NEEDS-USER|해결됨|위임\s*완료|사용자\s*확인\s*필요|✅)/im;
    if (allow.test(content)) return process.exit(0);

    // Count attempts: "[try N]" or "[시도N]" (domain-agnostic proxy).
    const tries = (content.match(/\[(try|시도)/gi) || []).length;
    if (tries >= THRESHOLD) {
      const reason =
        `trial-and-error log has ${tries} failed attempts and no resolution marker. ` +
        `Stop self-overestimating and DELEGATE now to an independent agent — give it ONLY the goal and ` +
        `invariants, leave the method open (do not hard-prompt your own polluted approach). ` +
        `"RESOLVED" counts only if a Google/Microsoft/Anthropic-grade review, run by a SEPARATE agent, ` +
        `would pass it. When done, add a line starting with RESOLVED / DELEGATED / NEEDS-USER, then stop again.`;
      process.stdout.write(JSON.stringify({ decision: 'block', reason }));
      return process.exit(0);
    }

    process.exit(0);
  } catch {
    process.exit(0); // fail-open: never break a normal session
  }
})();
