#!/usr/bin/env node

const { execSync } = require('child_process');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-ci';
process.env.FRONTEND_URL = 'http://localhost:3000';

function runCommand(command, description) {
  console.log(`\n=== ${description} ===`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      timeout: 300000 // 5 minutes
    });
    console.log(`${description} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`${description} - FAILED`);
    console.error(error.message);
    return false;
  }
}

const tests = [
  ['node scripts/validate-i18n.js', 'i18n Validation'],
  ['npx tsc --noEmit', 'TypeScript Check'],
  ['yarn test:unit:ci', 'Unit Tests'],
  ['yarn test:e2e:ci', 'E2E Tests'],
  ['yarn build', 'Build Application']
];

let allPassed = true;

console.log('Running CI pipeline locally...\n');

for (const [command, description] of tests) {
  const success = runCommand(command, description);
  if (!success) {
    allPassed = false;
    break;
  }
}

console.log('\n=== FINAL RESULT ===');
if (allPassed) {
  console.log('All tests passed! CI should work.');
} else {
  console.log('Some tests failed. Fix issues before pushing.');
  process.exit(1);
}