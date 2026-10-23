#!/usr/bin/env node
import fs from 'node:fs';

// Read JSON input from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = input.trim() ? JSON.parse(input) : {};
    const toolCall = payload.toolCall || {};

    if (toolCall.name === 'run_command') {
      const cmd = (toolCall.args && toolCall.args.CommandLine) || '';

      // Destructive command patterns to block deterministically
      const forbiddenPatterns = [
        { pattern: /\brm\s+-(?:r[fv]|fr)/i, label: 'Recursive file deletion (rm -rf)' },
        { pattern: /\bgit\s+reset\s+--hard/i, label: 'Hard Git reset (destroys uncommitted work)' },
        { pattern: /\bgit\s+clean\s+-(?:f[dx]|xfd)/i, label: 'Git force clean (destroys untracked files)' },
        { pattern: /\bdropDatabase\s*\(/i, label: 'MongoDB database drop command' },
        { pattern: />\s*\/dev\/sd[a-z]/i, label: 'Direct raw disk write' }
      ];

      for (const item of forbiddenPatterns) {
        if (item.pattern.test(cmd)) {
          const response = {
            decision: 'deny',
            reason: `[DETERMINISTIC GATE] Blocked: ${item.label}. Command: "${cmd}"`
          };
          process.stdout.write(JSON.stringify(response));
          process.exit(0);
        }
      }
    }

    // Default: allow execution
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    // Fail-safe: if hook parsing fails, deny for safety
    process.stdout.write(JSON.stringify({
      decision: 'deny',
      reason: `Hook parse error: ${err.message}`
    }));
  }
});
