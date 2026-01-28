#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-ci';
process.env.FRONTEND_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let testSuites = 0;
let failedSuites = [];

function runCommand(command, description) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr || error.message };
  }
}

const i18nResult = runCommand('node scripts/validate-i18n.js', 'Validação i18n');
const typeResult = runCommand('npx tsc --noEmit', 'Type checking');
if (!typeResult.success) {
  process.exit(1);
}

const unitResult = runCommand('yarn test:unit:ci', 'Testes unitários');

if (unitResult.output) {
  const testMatch = unitResult.output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
  const suiteMatch = unitResult.output.match(/Test Suites:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
  
  if (testMatch) {
    const passed = parseInt(testMatch[1]) || 0;
    const failed = parseInt(testMatch[2]) || 0;
    passedTests += passed;
    failedTests += failed;
    totalTests += passed + failed;
  }
  
  if (suiteMatch) {
    const passedSuites = parseInt(suiteMatch[1]) || 0;
    const failedSuites = parseInt(suiteMatch[2]) || 0;
    testSuites += passedSuites + failedSuites;
    
    if (failedSuites > 0) {
      failedSuites.push('Unit Tests');
    }
  }
}

const e2eResult = runCommand('yarn test:e2e:ci', 'Testes E2E');

if (e2eResult.output) {
  const testMatch = e2eResult.output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
  const suiteMatch = e2eResult.output.match(/Test Suites:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?/);
  
  if (testMatch) {
    const passed = parseInt(testMatch[1]) || 0;
    const failed = parseInt(testMatch[2]) || 0;
    passedTests += passed;
    failedTests += failed;
    totalTests += passed + failed;
  }
  
  if (suiteMatch) {
    const passedSuites = parseInt(suiteMatch[1]) || 0;
    const failedSuites = parseInt(suiteMatch[2]) || 0;
    testSuites += passedSuites + failedSuites;
    
    if (failedSuites > 0) {
      failedSuites.push('E2E Tests');
    }
  }
}

const buildResult = runCommand('yarn build', 'Build da aplicação');
if (!buildResult.success) {
  process.exit(1);
}

const allPassed = i18nResult.success && typeResult.success && unitResult.success && e2eResult.success && buildResult.success;

if (allPassed) {
  process.exit(0);
} else {
  process.exit(1);
}