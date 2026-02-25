#!/usr/bin/env node
/**
 * ============================================================
 * ENVIRONMENT VALIDATION SCRIPT
 * ============================================================
 * Validates environment configuration for all projects
 * - Checks required variables
 * - Validates project IDs
 * - Verifies guardrails
 * - Tests API connectivity (optional)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

type ProjectName = 'synqra' | 'noid' | 'aurafx';

interface ValidationResult {
  project: ProjectName;
  passed: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

const PROJECT_CONFIGS = {
  synqra: {
    projectId: 'proj_M5uK85kGHzXncUc8OJ7UVBTj',
    requiredVars: ['OPENAI_PROJECT_ID', 'ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    optionalVars: ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'HUGGINGFACE_API_TOKEN'],
    allowFreeEvals: true,
  },
  noid: {
    projectId: 'proj_i8k05tw3IYsFc0c3YdA0Hr43',
    requiredVars: ['OPENAI_PROJECT_ID', 'ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    optionalVars: ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'STRIPE_SECRET_KEY'],
    allowFreeEvals: true,
  },
  aurafx: {
    projectId: 'proj_P3jYUneeAXuSGniVCADn0XS',
    requiredVars: ['OPENAI_PROJECT_ID', 'ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    optionalVars: ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'HUGGINGFACE_API_TOKEN'],
    allowFreeEvals: false, // AuraFX is fully private
  },
};

/**
 * VALIDATE PROJECT ENVIRONMENT
 */
export async function validateEnv(
  project: ProjectName,
  options: { verbose?: boolean; testConnectivity?: boolean } = {}
): Promise<ValidationResult> {
  const result: ValidationResult = {
    project,
    passed: true,
    errors: [],
    warnings: [],
    info: [],
  };

  if (options.verbose) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  🔍 Validating ${project.toUpperCase()} Environment`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }

  // Load environment file
  const projectRoot = path.join(process.cwd(), project);
  const envPath = path.join(projectRoot, '.env.local');

  if (!fs.existsSync(envPath)) {
    result.errors.push('.env.local file not found');
    result.passed = false;
    return result;
  }

  const env = dotenv.parse(fs.readFileSync(envPath));

  // Step 1: Validate required variables
  validateRequiredVars(project, env, result);

  // Step 2: Validate project ID
  validateProjectId(project, env, result);

  // Step 3: Validate data controls
  validateDataControls(project, env, result);

  // Step 4: Validate API key format
  validateApiKeyFormat(project, env, result);

  // Step 5: Validate guardrail configuration
  validateGuardrails(project, result);

  // Step 6: Check optional variables
  checkOptionalVars(project, env, result);

  // Step 7: Test connectivity (if requested)
  if (options.testConnectivity) {
    await testConnectivity(project, env, result);
  }

  // Print results
  if (options.verbose) {
    printValidationResults(result);
  }

  return result;
}

/**
 * VALIDATE REQUIRED VARIABLES
 */
function validateRequiredVars(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): void {
  const config = PROJECT_CONFIGS[project];

  for (const varName of config.requiredVars) {
    if (!env[varName] || env[varName].includes('your_') || env[varName].includes('_here')) {
      result.errors.push(`Missing or placeholder value for required variable: ${varName}`);
      result.passed = false;
    } else {
      result.info.push(`✓ ${varName} is set`);
    }
  }
}

/**
 * VALIDATE PROJECT ID
 */
function validateProjectId(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): void {
  const config = PROJECT_CONFIGS[project];
  const projectId = env.OPENAI_PROJECT_ID || env.PROJECT_ID;

  if (!projectId) {
    result.errors.push('PROJECT_ID or OPENAI_PROJECT_ID not set');
    result.passed = false;
    return;
  }

  if (projectId !== config.projectId) {
    result.errors.push(
      `Project ID mismatch: Expected ${config.projectId} but found ${projectId}`
    );
    result.passed = false;
  } else {
    result.info.push(`✓ Project ID matches ${project}`);
  }
}

/**
 * VALIDATE DATA CONTROLS
 */
function validateDataControls(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): void {
  const config = PROJECT_CONFIGS[project];

  // Check free evals setting
  const allowFreeEvals = env.OPENAI_ALLOW_FREE_EVALS === 'true';
  if (allowFreeEvals !== config.allowFreeEvals) {
    result.warnings.push(
      `Free evals setting mismatch: Expected ${config.allowFreeEvals} but found ${allowFreeEvals}`
    );
  }

  // Data sharing should always be false
  const dataSharing = env.OPENAI_DATA_SHARING === 'true';
  if (dataSharing) {
    result.errors.push('Data sharing must be disabled (OPENAI_DATA_SHARING=false)');
    result.passed = false;
  }

  // AuraFX specific: Check zero retention
  if (project === 'aurafx') {
    const zeroRetention = env.OPENAI_ZERO_DATA_RETENTION === 'true';
    if (!zeroRetention) {
      result.errors.push('AuraFX requires zero data retention (OPENAI_ZERO_DATA_RETENTION=true)');
      result.passed = false;
    }
  }

  result.info.push('✓ Data controls validated');
}

/**
 * VALIDATE API KEY FORMAT
 */
function validateApiKeyFormat(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): void {
  // Check OpenAI API key format (if present)
  if (env.OPENAI_API_KEY) {
    const key = env.OPENAI_API_KEY;
    
    // Should start with sk-
    if (!key.startsWith('sk-')) {
      result.warnings.push('OpenAI API key format appears invalid (should start with sk-)');
    }

    // If it's a project key, validate project prefix
    if (key.startsWith('sk-proj-')) {
      const keyProjectMatch = key.match(/sk-proj-(\w+)-/);
      if (keyProjectMatch) {
        const keyProject = keyProjectMatch[1];
        if (keyProject !== project) {
          result.errors.push(
            `API key project mismatch: Key is for "${keyProject}" but validating for "${project}"`
          );
          result.passed = false;
        }
      }
    }
  }

  // Check Anthropic API key format
  if (env.ANTHROPIC_API_KEY && !env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    result.warnings.push('Anthropic API key format appears invalid (should start with sk-ant-)');
  }

  result.info.push('✓ API key formats checked');
}

/**
 * VALIDATE GUARDRAILS
 */
function validateGuardrails(project: ProjectName, result: ValidationResult): void {
  const projectRoot = path.join(process.cwd(), project);
  const guardrailsPath = path.join(projectRoot, 'config', 'guardrails.json');

  if (!fs.existsSync(guardrailsPath)) {
    result.warnings.push('Guardrails configuration not found (run init-repo to create)');
    return;
  }

  try {
    const guardrails = JSON.parse(fs.readFileSync(guardrailsPath, 'utf8'));
    
    if (guardrails.project !== project) {
      result.errors.push(`Guardrails project mismatch: ${guardrails.project} vs ${project}`);
      result.passed = false;
    }

    const expectedGuardrails = [
      'projectIsolation',
      'budgetTracking',
      'apiKeyValidation',
      'dataControls',
    ];

    for (const guard of expectedGuardrails) {
      if (!guardrails.guardrails[guard]) {
        result.warnings.push(`Guardrail not enabled: ${guard}`);
      }
    }

    result.info.push('✓ Guardrails configuration validated');
  } catch (error) {
    result.warnings.push('Failed to parse guardrails configuration');
  }
}

/**
 * CHECK OPTIONAL VARIABLES
 */
function checkOptionalVars(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): void {
  const config = PROJECT_CONFIGS[project];

  for (const varName of config.optionalVars) {
    if (!env[varName] || env[varName].includes('your_')) {
      result.warnings.push(`Optional variable not set: ${varName}`);
    } else {
      result.info.push(`✓ ${varName} is configured`);
    }
  }
}

/**
 * TEST CONNECTIVITY (Optional)
 */
async function testConnectivity(
  project: ProjectName,
  env: Record<string, string>,
  result: ValidationResult
): Promise<void> {
  result.info.push('Testing API connectivity...');

  // Test Supabase
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });
      
      if (response.ok) {
        result.info.push('✓ Supabase connectivity OK');
      } else {
        result.warnings.push(`Supabase connectivity test failed: ${response.status}`);
      }
    } catch (error) {
      result.warnings.push('Supabase connectivity test failed (network error)');
    }
  }

  // Note: We don't test OpenAI/Anthropic to avoid costs
  result.info.push('(Skipping AI API connectivity tests to avoid costs)');
}

/**
 * PRINT VALIDATION RESULTS
 */
function printValidationResults(result: ValidationResult): void {
  console.log('');
  console.log('Results:');
  console.log('─────────────────────────────────────────────────────────');

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(err => console.log(`   • ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warn => console.log(`   • ${warn}`));
  }

  if (result.info.length > 0 && result.errors.length === 0) {
    console.log('\n✅ INFO:');
    result.info.forEach(info => console.log(`   ${info}`));
  }

  console.log('');
  console.log('─────────────────────────────────────────────────────────');
  
  if (result.passed) {
    console.log('✅ Validation PASSED');
  } else {
    console.log('❌ Validation FAILED');
  }
  
  console.log('');
}

/**
 * VALIDATE ALL PROJECTS
 */
export async function validateAllProjects(): Promise<Record<ProjectName, ValidationResult>> {
  const results: Record<string, ValidationResult> = {};
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔍 Validating All Projects');
  console.log('═══════════════════════════════════════════════════════════');

  for (const project of ['synqra', 'noid', 'aurafx'] as ProjectName[]) {
    results[project] = await validateEnv(project, { verbose: true });
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let allPassed = true;
  for (const [project, result] of Object.entries(results)) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${project.padEnd(10)} ${status}`);
    if (!result.passed) allPassed = false;
  }

  console.log('');
  return results;
}

/**
 * CLI ENTRY POINT
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'all') {
    validateAllProjects()
      .then((results) => {
        const allPassed = Object.values(results).every(r => r.passed);
        process.exit(allPassed ? 0 : 1);
      })
      .catch((error) => {
        console.error('Validation error:', error);
        process.exit(1);
      });
  } else {
    const project = args[0] as ProjectName;
    
    if (!['synqra', 'noid', 'aurafx'].includes(project)) {
      console.error('Usage: node validate-env.ts <synqra|noid|aurafx|all> [--test-connectivity]');
      process.exit(1);
    }

    const options = {
      verbose: true,
      testConnectivity: args.includes('--test-connectivity'),
    };

    validateEnv(project, options)
      .then((result) => {
        process.exit(result.passed ? 0 : 1);
      })
      .catch((error) => {
        console.error('Validation error:', error);
        process.exit(1);
      });
  }
}
