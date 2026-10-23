#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

console.log('='.repeat(70));
console.log(`🚀 Antigravity Production Guardrail Initializer`);
console.log(`Target Repository: ${targetDir}`);
console.log('='.repeat(70));

if (!fs.existsSync(targetDir)) {
  console.error(`Target directory does not exist: ${targetDir}`);
  process.exit(1);
}

// 1. Create directory structure
const dirsToCreate = [
  path.join(targetDir, '.agents'),
  path.join(targetDir, '.agents/scripts'),
  path.join(targetDir, '.agents/rules'),
  path.join(targetDir, '.agents/skills/node-service-generator'),
  path.join(targetDir, '.agents/skills/db-migration-runbook')
];

dirsToCreate.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// 2. Write GEMINI.md if not exists
const geminiMdPath = path.join(targetDir, 'GEMINI.md');
if (!fs.existsSync(geminiMdPath)) {
  const geminiContent = `# Project Rules & Production Standards

## 1. Engineering Philosophy
- **Verification First**: Never mark a task complete without running and validating automated tests.
- **Amplification, Not Automation**: AI agents assist, but technical architecture, security checks, and data schemas require strict human review.
- **Minimal Context Footprint**: Keep context lean. Use targeted line ranges and subagents.

## 2. Backend Coding Standards (Node.js / Express)
- Architecture: Layered separation (Routes -> Controllers -> Services -> Repositories).
- Validation: All incoming requests must be strictly validated using Zod.
- Error Handling: Use centralized RFC 7807 error middleware. Never swallow errors.
- Security: Sanitize inputs, enforce rate limiting, use Helmet, and NEVER commit secrets.

## 3. Database Standards (MongoDB / Mongoose)
- Strict schemas with indexes and timestamps.
- Use explicit database transactions (session.withTransaction) for multi-document ACID operations.
- Zero-downtime migrations (expand -> dual-write -> backfill -> contract).
`;
  fs.writeFileSync(geminiMdPath, geminiContent, 'utf8');
  console.log(`✅ Created: GEMINI.md`);
} else {
  console.log(`ℹ️  GEMINI.md already exists (skipped)`);
}

// 3. Write .agents/scripts/pre-tool-safety.js
const safetyScriptPath = path.join(targetDir, '.agents/scripts/pre-tool-safety.js');
const safetyScriptContent = `#!/usr/bin/env node
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
        { pattern: /\\brm\\s+-(?:r[fv]|fr)/i, label: 'Recursive file deletion (rm -rf)' },
        { pattern: /\\bgit\\s+reset\\s+--hard/i, label: 'Hard Git reset' },
        { pattern: /\\bgit\\s+push\\s+.*--force/i, label: 'Force Git push' },
        { pattern: /\\bdropDatabase\\s*\\(/i, label: 'MongoDB database drop' }
      ];

      for (const item of dangerousPatterns) {
        if (item.pattern.test(cmd)) {
          process.stdout.write(JSON.stringify({
            decision: 'deny',
            reason: \`[SAFETY GATE] Blocked: \${item.label}. Command: "\${cmd}"\`
          }));
          process.exit(0);
        }
      }
    }

    // Block reading or editing secret files (.env, credentials)
    if (toolCall.name === 'read_file' || toolCall.name === 'edit_file' || toolCall.name === 'write_file') {
      const filePath = (toolCall.args && (toolCall.args.Path || toolCall.args.path)) || '';
      if (/\\.env(?:\\.[a-z0-9_-]+)?$/i.test(filePath) || /id_rsa|id_ed25519|secrets\\.json/i.test(filePath)) {
        process.stdout.write(JSON.stringify({
          decision: 'deny',
          reason: \`[SAFETY GATE] Access blocked to sensitive credential file: \${filePath}\`
        }));
        process.exit(0);
      }
    }

    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason: \`Hook error: \${err.message}\` }));
  }
});
`;
fs.writeFileSync(safetyScriptPath, safetyScriptContent, 'utf8');
fs.chmodSync(safetyScriptPath, 0o755);
console.log(`✅ Created: .agents/scripts/pre-tool-safety.js`);

// 4. Write .agents/hooks.json
const hooksPath = path.join(targetDir, '.agents/hooks.json');
const hooksContent = JSON.stringify({
  "production-safety-gate": {
    "enabled": true,
    "PreToolUse": [
      {
        "matcher": "run_command|read_file|edit_file|write_file",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/pre-tool-safety.js",
            "timeout": 10
          }
        ]
      }
    ]
  }
}, null, 2);
fs.writeFileSync(hooksPath, hooksContent, 'utf8');
console.log(`✅ Created: .agents/hooks.json`);

// 5. Write db-migration-runbook skill
const migrationSkillPath = path.join(targetDir, '.agents/skills/db-migration-runbook/SKILL.md');
const migrationSkillContent = `---
name: db-migration-runbook
description: >-
  Use this skill when modifying database models, adding columns/fields, or performing MongoDB schema migrations.
  Enforces zero-downtime expand-contract protocol.
---

# Zero-Downtime Database Migration Runbook

Whenever migrating database models or schema structures, follow the 4-phase Expand-Contract pattern:

## Phase 1: Expand
- Add new fields to the Mongoose/Mongo schema as optional.
- Service reads from new field if present, otherwise falls back to old field.
- Deploy Phase 1.

## Phase 2: Dual-Write
- Application writes updates to BOTH the old field and the new field simultaneously.
- Deploy Phase 2.

## Phase 3: Backfill Batch Job
- Run a throttled background script to populate the new field for legacy documents.
- Process in batches (e.g. 500 documents per batch) with delay to avoid replica set saturation.

## Phase 4: Contract
- Update service to read exclusively from the new field.
- Remove old field from schema writes.
- Drop or archive the deprecated field.
- Deploy Phase 4.
`;
fs.writeFileSync(migrationSkillPath, migrationSkillContent, 'utf8');
console.log(`✅ Created: .agents/skills/db-migration-runbook/SKILL.md`);

console.log('='.repeat(70));
console.log(`🎉 Antigravity Production Guardrails installed successfully!`);
console.log(`Your repository is now protected against:`);
console.log(`- Accidental secret leaks (.env files)`);
console.log(`- Destructive shell commands (rm -rf, git force-push)`);
console.log(`- Schema breaking changes (zero-downtime migration runbook)`);
console.log('='.repeat(70));
