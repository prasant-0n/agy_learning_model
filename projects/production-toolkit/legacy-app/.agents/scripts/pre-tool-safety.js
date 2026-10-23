#!/usr/bin/env node
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = input.trim() ? JSON.parse(input) : {};
    const toolCall = payload.toolCall || {};

    // Block destructive terminal commands
    if (toolCall.name === 'run_command') {
      const cmd = (toolCall.args && toolCall.args.CommandLine) || '';
      const dangerousPatterns = [
        { pattern: /\brm\s+-(?:r[fv]|fr)/i, label: 'Recursive file deletion (rm -rf)' },
        { pattern: /\bgit\s+reset\s+--hard/i, label: 'Hard Git reset' },
        { pattern: /\bgit\s+push\s+.*--force/i, label: 'Force Git push' },
        { pattern: /\bdropDatabase\s*\(/i, label: 'MongoDB database drop' }
      ];

      for (const item of dangerousPatterns) {
        if (item.pattern.test(cmd)) {
          process.stdout.write(JSON.stringify({
            decision: 'deny',
            reason: `[SAFETY GATE] Blocked: ${item.label}. Command: "${cmd}"`
          }));
          process.exit(0);
        }
      }
    }

    // Block reading or editing secret files (.env, credentials)
    if (toolCall.name === 'read_file' || toolCall.name === 'edit_file' || toolCall.name === 'write_file') {
      const filePath = (toolCall.args && (toolCall.args.Path || toolCall.args.path)) || '';
      if (/\.env(?:\.[a-z0-9_-]+)?$/i.test(filePath) || /id_rsa|id_ed25519|secrets\.json/i.test(filePath)) {
        process.stdout.write(JSON.stringify({
          decision: 'deny',
          reason: `[SAFETY GATE] Access blocked to sensitive credential file: ${filePath}`
        }));
        process.exit(0);
      }
    }

    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason: `Hook error: ${err.message}` }));
  }
});
