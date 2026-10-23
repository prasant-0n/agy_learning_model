#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const BRAIN_DIR = path.join(HOME, '.gemini/antigravity-cli/brain');

function findLatestTranscript() {
  if (!fs.existsSync(BRAIN_DIR)) {
    console.error(`Brain directory not found at: ${BRAIN_DIR}`);
    process.exit(1);
  }

  const convDirs = fs.readdirSync(BRAIN_DIR)
    .map(name => ({
      name,
      fullPath: path.join(BRAIN_DIR, name),
      stat: fs.statSync(path.join(BRAIN_DIR, name))
    }))
    .filter(item => item.stat.isDirectory() && !item.name.startsWith('.'))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  for (const conv of convDirs) {
    const transcriptPath = path.join(conv.fullPath, '.system_generated/logs/transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      return { conversationId: conv.name, transcriptPath };
    }
  }

  return null;
}

const target = findLatestTranscript();
if (!target) {
  console.error('No transcript found.');
  process.exit(1);
}

console.log('='.repeat(70));
console.log(`🔍 Antigravity Session Inspector`);
console.log(`Conversation ID : ${target.conversationId}`);
console.log(`Transcript Path : ${target.transcriptPath}`);
console.log('='.repeat(70));

const lines = fs.readFileSync(target.transcriptPath, 'utf8')
  .split('\n')
  .filter(l => l.trim().length > 0);

console.log(`\n📊 Trajectory Overview:`);
console.log(`Total Steps Logged: ${lines.length}`);

const stepTypes = {};
const toolCounts = {};
let totalThinkingChars = 0;
let userPrompts = 0;

lines.forEach((line, idx) => {
  try {
    const step = JSON.parse(line);
    stepTypes[step.type] = (stepTypes[step.type] || 0) + 1;

    if (step.type === 'USER_INPUT') {
      userPrompts++;
    }

    if (step.thinking) {
      totalThinkingChars += step.thinking.length;
    }

    if (Array.isArray(step.tool_calls)) {
      for (const call of step.tool_calls) {
        const name = call.name || 'unknown';
        toolCounts[name] = (toolCounts[name] || 0) + 1;
      }
    }
  } catch (err) {
    console.error(`Error parsing line ${idx + 1}: ${err.message}`);
  }
});

console.log('\n--- Step Type Breakdown ---');
console.table(stepTypes);

console.log('\n--- Tool Invocations ---');
console.table(toolCounts);

console.log('\n--- Cognitive & Context Telemetry ---');
console.log(`User Prompts Recorded    : ${userPrompts}`);
console.log(`Internal Thinking Volume : ${(totalThinkingChars / 1024).toFixed(2)} KB (~${Math.round(totalThinkingChars / 4)} tokens)`);
console.log(`Transcript File Size     : ${(fs.statSync(target.transcriptPath).size / 1024).toFixed(2)} KB`);

console.log('\n--- Recent 3 Steps Summary ---');
lines.slice(-3).forEach(line => {
  const step = JSON.parse(line);
  const time = step.created_at ? new Date(step.created_at).toLocaleTimeString() : 'N/A';
  const tools = step.tool_calls ? step.tool_calls.map(t => t.name).join(', ') : 'None';
  console.log(`[Step ${step.step_index}] ${time} | Type: ${step.type} | Tools: ${tools}`);
});

console.log('='.repeat(70));
