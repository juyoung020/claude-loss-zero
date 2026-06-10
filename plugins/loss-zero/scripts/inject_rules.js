#!/usr/bin/env node
'use strict';
/*
 * SessionStart hook — inject the always-on working rules.
 *
 * Reads rules/RULES.md and returns it as additionalContext so the rules load
 * at the start of every session (the plugin equivalent of a global CLAUDE.md).
 * Fail-open: if the file is missing, inject nothing rather than break the session.
 */

const fs = require('fs');
const path = require('path');

try {
  const rulesPath = path.join(__dirname, '..', 'rules', 'RULES.md');
  const text = fs.readFileSync(rulesPath, 'utf8');
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: text,
      },
    })
  );
} catch (_) {
  // fail-open
}
process.exit(0);
