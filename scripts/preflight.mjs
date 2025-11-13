#!/usr/bin/env node

/**
 * Preflight Check Script
 * Windows-compatible Node.js version
 * Verifies system requirements and prepares the environment
 */

import { execSync } from 'child_process';
import { exit } from 'process';

// ANSI color codes for better visibility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Execute a command and return the output
 */
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: output?.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout?.toString().trim(),
    };
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  logStep('1', 'Checking Node.js version...');
  
  const result = runCommand('node --version', { silent: true });
  
  if (!result.success) {
    logError('Failed to get Node.js version');
    return false;
  }
  
  const currentVersion = result.output.replace('v', '');
  const requiredVersion = '20.11.1';
  
  log(`Current version: ${currentVersion}`);
  log(`Required version: ${requiredVersion}`);
  
  if (currentVersion === requiredVersion) {
    logSuccess('Node.js version matches exactly');
    return true;
  } else {
    logWarning(`Node.js version mismatch (current: ${currentVersion}, required: ${requiredVersion})`);
    logWarning('Continuing anyway, but issues may occur...');
    return true; // Continue anyway
  }
}

/**
 * Check npm version
 */
function checkNpmVersion() {
  logStep('2', 'Checking npm version...');
  
  const result = runCommand('npm --version', { silent: true });
  
  if (!result.success) {
    logError('Failed to get npm version');
    return false;
  }
  
  const currentVersion = result.output;
  const requiredVersion = '10.5.0';
  
  log(`Current version: ${currentVersion}`);
  log(`Required version: ${requiredVersion}`);
  
  if (currentVersion === requiredVersion) {
    logSuccess('npm version matches exactly');
    return true;
  } else {
    logWarning(`npm version mismatch (current: ${currentVersion}, required: ${requiredVersion})`);
    logWarning('Continuing anyway, but issues may occur...');
    return true; // Continue anyway
  }
}

/**
 * Verify npm cache
 */
function verifyNpmCache() {
  logStep('3', 'Verifying npm cache...');
  
  const result = runCommand('npm cache verify', { silent: false });
  
  if (result.success) {
    logSuccess('npm cache verified successfully');
    return true;
  } else {
    logError('npm cache verification failed');
    return false;
  }
}

/**
 * Ensure directory structure
 */
function ensureStructure() {
  logStep('4', 'Ensuring directory structure...');
  
  const result = runCommand('node scripts/ensure-structure.mjs', { silent: false });
  
  if (result.success) {
    logSuccess('Directory structure verified');
    return true;
  } else {
    logError('Failed to ensure directory structure');
    return false;
  }
}

/**
 * Run npm ci (clean install)
 */
function runNpmCi() {
  logStep('5', 'Running npm ci (clean install)...');
  log('This may take a few minutes...');
  
  const result = runCommand('npm ci', { silent: false });
  
  if (result.success) {
    logSuccess('Dependencies installed successfully');
    return true;
  } else {
    logError('npm ci failed');
    logWarning('If you don\'t have package-lock.json, try running "npm install" instead');
    return false;
  }
}

/**
 * Run build
 */
function runBuild() {
  logStep('6', 'Running build...');
  log('This may take a few minutes...');
  
  const result = runCommand('npm run build', { silent: false });
  
  if (result.success) {
    logSuccess('Build completed successfully');
    return true;
  } else {
    logError('Build failed');
    return false;
  }
}

/**
 * Main preflight check function
 */
async function main() {
  log('\n╔═══════════════════════════════════════╗', colors.blue);
  log('║     SYNQRA PREFLIGHT CHECK            ║', colors.blue);
  log('╚═══════════════════════════════════════╝', colors.blue);
  log('Windows-compatible version\n');
  
  const steps = [
    { name: 'Node.js version check', fn: checkNodeVersion },
    { name: 'npm version check', fn: checkNpmVersion },
    { name: 'npm cache verification', fn: verifyNpmCache },
    { name: 'Directory structure', fn: ensureStructure },
    { name: 'npm ci', fn: runNpmCi },
    { name: 'Build', fn: runBuild },
  ];
  
  const results = [];
  let allPassed = true;
  
  for (const step of steps) {
    const passed = step.fn();
    results.push({ name: step.name, passed });
    
    if (!passed) {
      allPassed = false;
      logError(`${step.name} failed`);
      break; // Stop on first failure
    }
  }
  
  // Summary
  log('\n╔═══════════════════════════════════════╗', colors.blue);
  log('║           PREFLIGHT SUMMARY           ║', colors.blue);
  log('╚═══════════════════════════════════════╝', colors.blue);
  
  results.forEach(result => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    log(`${status} ${result.name}`, color);
  });
  
  if (allPassed) {
    log('\n✓ All preflight checks passed!', colors.green);
    log('You can now run: npm run dev\n', colors.cyan);
    exit(0);
  } else {
    log('\n✗ Preflight checks failed', colors.red);
    log('Please fix the issues above and try again\n', colors.yellow);
    exit(1);
  }
}

// Run the preflight check
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  exit(1);
});

