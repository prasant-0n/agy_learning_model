#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('='.repeat(70));
console.log(`🌙 Antigravity Autonomous Nightly Audit Running: ${new Date().toISOString()}`);
console.log('='.repeat(70));

const report = {
  timestamp: new Date().toISOString(),
  testSuiteStatus: 'UNKNOWN',
  vulnerabilitiesFound: 0,
  details: {}
};

try {
  // 1. Run workspace test suites
  console.log('• Running complete test suite...');
  const testOutput = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
  report.testSuiteStatus = 'PASSED';
  report.details.testSummary = 'All unit, integration, and security tests passed.';
  console.log('  └─ Test Suite: ✅ GREEN');
} catch (err) {
  report.testSuiteStatus = 'FAILED';
  report.details.testSummary = err.message;
  console.log('  └─ Test Suite: ❌ RED');
}

// 2. Audit npm packages
try {
  console.log('• Running npm security audit...');
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
  const auditData = JSON.parse(auditOutput);
  report.vulnerabilitiesFound = (auditData.metadata && auditData.metadata.vulnerabilities && auditData.metadata.vulnerabilities.total) || 0;
  console.log(`  └─ Vulnerabilities Found: ${report.vulnerabilitiesFound}`);
} catch (err) {
  // npm audit exits with non-zero if vulnerabilities are found
  report.vulnerabilitiesFound = 'Audit alert (check npm audit)';
  console.log('  └─ Vulnerability scan completed with findings.');
}

const reportPath = path.resolve('projects/autonomous-workflows/last-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('='.repeat(70));
console.log(`📄 Audit report generated at: ${reportPath}`);
console.log('='.repeat(70));
