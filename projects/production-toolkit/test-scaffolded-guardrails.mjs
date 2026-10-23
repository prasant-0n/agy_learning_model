#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert';

const HOOK_SCRIPT = path.resolve('projects/production-toolkit/legacy-app/.agents/scripts/pre-tool-safety.js');

function runHook(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [HOOK_SCRIPT], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`Hook exited with code ${code}`));
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Failed to parse hook output: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function testSuite() {
  console.log('='.repeat(70));
  console.log('🧪 Testing Scaffolded Production Guardrails (Credential & Shell Defense)');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: 'Blocks reading .env credentials',
      payload: { toolCall: { name: 'read_file', args: { Path: '/var/www/.env' } } },
      expectedDecision: 'deny'
    },
    {
      name: 'Blocks reading .env.production',
      payload: { toolCall: { name: 'read_file', args: { Path: '/var/www/.env.production' } } },
      expectedDecision: 'deny'
    },
    {
      name: 'Blocks Git force push (git push origin main --force)',
      payload: { toolCall: { name: 'run_command', args: { CommandLine: 'git push origin main --force' } } },
      expectedDecision: 'deny'
    },
    {
      name: 'Allows reading normal application source file',
      payload: { toolCall: { name: 'read_file', args: { Path: '/var/www/src/server.js' } } },
      expectedDecision: 'allow'
    },
    {
      name: 'Allows running safe test runner',
      payload: { toolCall: { name: 'run_command', args: { CommandLine: 'npm test' } } },
      expectedDecision: 'allow'
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    process.stdout.write(`• Testing: ${tc.name} ... `);
    const result = await runHook(tc.payload);

    if (result.decision === tc.expectedDecision) {
      console.log(`✅ PASSED (${result.decision})`);
      if (result.reason) console.log(`  └─ ${result.reason}`);
      passed++;
    } else {
      console.log(`❌ FAILED (Expected: ${tc.expectedDecision}, Got: ${result.decision})`);
    }
  }

  console.log('='.repeat(70));
  console.log(`Results: ${passed}/${testCases.length} tests passed.`);
  console.log('='.repeat(70));

  assert.strictEqual(passed, testCases.length, 'All scaffolded guardrail tests must pass.');
}

testSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
