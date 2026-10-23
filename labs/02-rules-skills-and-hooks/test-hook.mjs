#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert';

const HOOK_SCRIPT = path.resolve('.agents/scripts/pre-tool-safety.js');

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
  console.log('🧪 Testing PreToolUse Lifecycle Hook (Deterministic Safety Gate)');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: 'Safe command: npm test',
      payload: { toolCall: { name: 'run_command', args: { CommandLine: 'npm test' } } },
      expectedDecision: 'allow'
    },
    {
      name: 'Destructive command: rm -rf /var/logs',
      payload: { toolCall: { name: 'run_command', args: { CommandLine: 'rm -rf /var/logs' } } },
      expectedDecision: 'deny'
    },
    {
      name: 'Destructive command: git reset --hard HEAD~1',
      payload: { toolCall: { name: 'run_command', args: { CommandLine: 'git reset --hard HEAD~1' } } },
      expectedDecision: 'deny'
    },
    {
      name: 'Benign tool: read_file',
      payload: { toolCall: { name: 'read_file', args: { Path: '/app/server.js' } } },
      expectedDecision: 'allow'
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    process.stdout.write(`• Testing: ${tc.name} ... `);
    const result = await runHook(tc.payload);

    if (result.decision === tc.expectedDecision) {
      console.log(`✅ PASSED (Decision: ${result.decision})`);
      if (result.reason) {
        console.log(`  └─ Reason: ${result.reason}`);
      }
      passed++;
    } else {
      console.log(`❌ FAILED (Expected: ${tc.expectedDecision}, Got: ${result.decision})`);
    }
  }

  console.log('='.repeat(70));
  console.log(`Results: ${passed}/${testCases.length} tests passed.`);
  console.log('='.repeat(70));

  assert.strictEqual(passed, testCases.length, 'All hook test cases must pass.');
}

testSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
