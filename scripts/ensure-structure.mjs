#!/usr/bin/env node

/**
 * Ensure Structure Script
 * Windows-compatible Node.js version
 * Creates missing folders and files
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    log(`✓ Created directory: ${dirPath}`, colors.green);
    return true;
  } else {
    log(`  Directory already exists: ${dirPath}`, colors.yellow);
    return false;
  }
}

/**
 * Ensure file exists with content
 */
function ensureFile(filePath, content, description) {
  // First ensure the directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`✓ Created directory: ${dir}`, colors.green);
  }
  
  // Then create the file if it doesn't exist
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, 'utf8');
    log(`✓ Created file: ${filePath}`, colors.green);
    if (description) {
      log(`  ${description}`, colors.cyan);
    }
    return true;
  } else {
    log(`  File already exists: ${filePath}`, colors.yellow);
    return false;
  }
}

/**
 * Main function to ensure structure
 */
function main() {
  log('\n╔═══════════════════════════════════════╗', colors.cyan);
  log('║     ENSURING DIRECTORY STRUCTURE      ║', colors.cyan);
  log('╚═══════════════════════════════════════╝', colors.cyan);
  log('');
  
  let changesCount = 0;
  
  // 1. Health endpoint stub
  const healthRoutePath = join(projectRoot, 'synqra', 'next', 'app', 'api', 'health', 'route.ts');
  const healthRouteContent = `import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 * Returns the current health status of the application
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/health
 * Lightweight health check (no body)
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
`;
  
  if (ensureFile(healthRoutePath, healthRouteContent, 'Health endpoint for monitoring')) {
    changesCount++;
  }
  
  // 2. Global CSS file
  const globalsCssPath = join(projectRoot, 'synqra', 'next', 'styles', 'globals.css');
  const globalsCssContent = `/* Global Styles */
/* This file is intentionally minimal - add your global styles here */

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}
`;
  
  if (ensureFile(globalsCssPath, globalsCssContent, 'Global CSS styles')) {
    changesCount++;
  }
  
  // Summary
  log('');
  log('╔═══════════════════════════════════════╗', colors.cyan);
  log('║              SUMMARY                  ║', colors.cyan);
  log('╚═══════════════════════════════════════╝', colors.cyan);
  
  if (changesCount > 0) {
    log(`✓ Created ${changesCount} new file(s)/folder(s)`, colors.green);
  } else {
    log('✓ All required files and folders already exist', colors.green);
  }
  
  log('✓ Directory structure is ready\n', colors.green);
  
  return true;
}

// Run the script
try {
  main();
  process.exit(0);
} catch (error) {
  console.error('Error ensuring structure:', error);
  process.exit(1);
}

