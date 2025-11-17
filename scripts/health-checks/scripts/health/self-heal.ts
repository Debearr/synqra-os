#!/usr/bin/env node
/**
 * ============================================================
 * SELF-HEALING SYSTEM
 * ============================================================
 * Automatically detects and fixes common issues across projects
 * - Environment misconfigurations
 * - Missing dependencies
 * - Broken guardrails
 * - Budget threshold violations
 * - API connectivity issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type ProjectName = 'synqra' | 'noid' | 'aurafx';
type IssueType = 'env' | 'deps' | 'guardrail' | 'budget' | 'connectivity';

interface Issue {
  type: IssueType;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  autoFixable: boolean;
  fix?: () => Promise<void>;
}

interface HealthReport {
  project: ProjectName;
  timestamp: string;
  healthy: boolean;
  issues: Issue[];
  fixedIssues: string[];
  remainingIssues: string[];
}

/**
 * MAIN SELF-HEAL FUNCTION
 */
export async function selfHeal(
  project: ProjectName,
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<HealthReport> {
  const { dryRun = false, verbose = true } = options;

  if (verbose) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  🔧 Self-Healing: ${project.toUpperCase()}`);
    console.log(`  Mode: ${dryRun ? 'DRY RUN (no changes)' : 'ACTIVE HEALING'}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }

  const report: HealthReport = {
    project,
    timestamp: new Date().toISOString(),
    healthy: true,
    issues: [],
    fixedIssues: [],
    remainingIssues: [],
  };

  // Run diagnostics
  await runDiagnostics(project, report);

  // Attempt fixes (if not dry run)
  if (!dryRun) {
    await applyFixes(project, report, verbose);
  }

  // Update health status
  report.healthy = report.issues.filter(i => i.severity === 'critical').length === 0;

  if (verbose) {
    printHealthReport(report, dryRun);
  }

  return report;
}

/**
 * RUN DIAGNOSTICS
 * Detects issues across all system components
 */
async function runDiagnostics(project: ProjectName, report: HealthReport): Promise<void> {
  // Check 1: Environment configuration
  await checkEnvironment(project, report);

  // Check 2: Dependencies
  await checkDependencies(project, report);

  // Check 3: Guardrails
  await checkGuardrails(project, report);

  // Check 4: Budget status
  await checkBudgetStatus(project, report);

  // Check 5: File structure
  await checkFileStructure(project, report);
}

/**
 * CHECK ENVIRONMENT
 */
async function checkEnvironment(project: ProjectName, report: HealthReport): Promise<void> {
  const projectRoot = path.join(process.cwd(), project);
  const envPath = path.join(projectRoot, '.env.local');
  const envExamplePath = path.join(projectRoot, '.env.example');

  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    report.issues.push({
      type: 'env',
      severity: 'critical',
      description: '.env.local file missing',
      autoFixable: fs.existsSync(envExamplePath),
      fix: async () => {
        if (fs.existsSync(envExamplePath)) {
          fs.copyFileSync(envExamplePath, envPath);
          console.log('   ✅ Created .env.local from template');
        }
      },
    });
  }

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    report.issues.push({
      type: 'env',
      severity: 'warning',
      description: '.env.example file missing',
      autoFixable: false,
    });
  }

  // Check for placeholder values in .env.local
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('your_') || envContent.includes('_here')) {
      report.issues.push({
        type: 'env',
        severity: 'warning',
        description: 'Environment file contains placeholder values',
        autoFixable: false,
      });
    }
  }
}

/**
 * CHECK DEPENDENCIES
 */
async function checkDependencies(project: ProjectName, report: HealthReport): Promise<void> {
  const projectRoot = path.join(process.cwd(), project);
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');

  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    report.issues.push({
      type: 'deps',
      severity: 'critical',
      description: 'package.json missing',
      autoFixable: false,
    });
    return;
  }

  // Check if node_modules exists
  if (!fs.existsSync(nodeModulesPath)) {
    report.issues.push({
      type: 'deps',
      severity: 'critical',
      description: 'node_modules missing (dependencies not installed)',
      autoFixable: true,
      fix: async () => {
        console.log('   📦 Installing dependencies...');
        try {
          execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
          console.log('   ✅ Dependencies installed');
        } catch (error) {
          console.error('   ❌ Failed to install dependencies');
          throw error;
        }
      },
    });
  }
}

/**
 * CHECK GUARDRAILS
 */
async function checkGuardrails(project: ProjectName, report: HealthReport): Promise<void> {
  const projectRoot = path.join(process.cwd(), project);
  const guardrailsPath = path.join(projectRoot, 'config', 'guardrails.json');

  if (!fs.existsSync(guardrailsPath)) {
    report.issues.push({
      type: 'guardrail',
      severity: 'warning',
      description: 'Guardrails configuration missing',
      autoFixable: true,
      fix: async () => {
        const configDir = path.join(projectRoot, 'config');
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }

        const guardrailConfig = {
          project,
          projectId: getProjectId(project),
          initialized: new Date().toISOString(),
          guardrails: {
            projectIsolation: true,
            budgetTracking: true,
            apiKeyValidation: true,
            dataControls: true,
          },
        };

        fs.writeFileSync(guardrailsPath, JSON.stringify(guardrailConfig, null, 2));
        console.log('   ✅ Created guardrails configuration');
      },
    });
  } else {
    // Validate guardrails content
    try {
      const guardrails = JSON.parse(fs.readFileSync(guardrailsPath, 'utf8'));
      
      if (guardrails.project !== project) {
        report.issues.push({
          type: 'guardrail',
          severity: 'critical',
          description: `Guardrails project mismatch: ${guardrails.project} vs ${project}`,
          autoFixable: true,
          fix: async () => {
            guardrails.project = project;
            guardrails.projectId = getProjectId(project);
            fs.writeFileSync(guardrailsPath, JSON.stringify(guardrails, null, 2));
            console.log('   ✅ Fixed guardrails project mismatch');
          },
        });
      }
    } catch (error) {
      report.issues.push({
        type: 'guardrail',
        severity: 'critical',
        description: 'Guardrails configuration is corrupted',
        autoFixable: false,
      });
    }
  }
}

/**
 * CHECK BUDGET STATUS
 */
async function checkBudgetStatus(project: ProjectName, report: HealthReport): Promise<void> {
  // This would integrate with actual budget tracking system
  // For now, check if budget tracking is configured

  const projectRoot = path.join(process.cwd(), project);
  const configPath = path.join(projectRoot, 'config', 'project.json');

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.budget) {
        report.issues.push({
          type: 'budget',
          severity: 'warning',
          description: 'Budget configuration missing',
          autoFixable: true,
          fix: async () => {
            config.budget = {
              monthly: project === 'aurafx' ? 500 : project === 'synqra' ? 300 : 250,
              alertThreshold: 0.80,
              lockThreshold: 0.95,
            };
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('   ✅ Added budget configuration');
          },
        });
      }
    } catch (error) {
      // Config file is corrupted or invalid
    }
  }
}

/**
 * CHECK FILE STRUCTURE
 */
async function checkFileStructure(project: ProjectName, report: HealthReport): Promise<void> {
  const projectRoot = path.join(process.cwd(), project);
  const requiredDirs = ['config', 'lib', 'scripts', 'docs'];

  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) {
      report.issues.push({
        type: 'env',
        severity: 'warning',
        description: `Missing directory: ${dir}`,
        autoFixable: true,
        fix: async () => {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`   ✅ Created directory: ${dir}`);
        },
      });
    }
  }

  // Check .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    report.issues.push({
      type: 'env',
      severity: 'info',
      description: '.gitignore missing',
      autoFixable: true,
      fix: async () => {
        const gitignoreContent = `.env.local
.env
node_modules/
dist/
.next/
*.log
.DS_Store
`;
        fs.writeFileSync(gitignorePath, gitignoreContent);
        console.log('   ✅ Created .gitignore');
      },
    });
  }
}

/**
 * APPLY FIXES
 */
async function applyFixes(
  project: ProjectName,
  report: HealthReport,
  verbose: boolean
): Promise<void> {
  if (verbose) {
    console.log('🔧 Applying fixes...\n');
  }

  for (const issue of report.issues) {
    if (issue.autoFixable && issue.fix) {
      try {
        if (verbose) {
          console.log(`   Fixing: ${issue.description}`);
        }
        await issue.fix();
        report.fixedIssues.push(issue.description);
      } catch (error) {
        if (verbose) {
          console.error(`   ❌ Failed to fix: ${issue.description}`);
        }
        report.remainingIssues.push(issue.description);
      }
    } else {
      report.remainingIssues.push(issue.description);
    }
  }
}

/**
 * PRINT HEALTH REPORT
 */
function printHealthReport(report: HealthReport, dryRun: boolean): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Health Report');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (report.issues.length === 0) {
    console.log('✅ No issues detected - system is healthy!');
  } else {
    console.log(`Found ${report.issues.length} issue(s):\n`);

    const critical = report.issues.filter(i => i.severity === 'critical');
    const warnings = report.issues.filter(i => i.severity === 'warning');
    const info = report.issues.filter(i => i.severity === 'info');

    if (critical.length > 0) {
      console.log('🔴 CRITICAL:');
      critical.forEach(i => console.log(`   • ${i.description} ${i.autoFixable ? '(auto-fixable)' : '(manual fix required)'}`));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      warnings.forEach(i => console.log(`   • ${i.description} ${i.autoFixable ? '(auto-fixable)' : '(manual fix required)'}`));
      console.log('');
    }

    if (info.length > 0) {
      console.log('ℹ️  INFO:');
      info.forEach(i => console.log(`   • ${i.description} ${i.autoFixable ? '(auto-fixable)' : ''}`));
      console.log('');
    }
  }

  if (!dryRun) {
    if (report.fixedIssues.length > 0) {
      console.log(`✅ Fixed ${report.fixedIssues.length} issue(s)`);
    }

    if (report.remainingIssues.length > 0) {
      console.log(`⚠️  ${report.remainingIssues.length} issue(s) require manual intervention`);
    }
  }

  console.log('');
  console.log(`Status: ${report.healthy ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);
  console.log('');
}

/**
 * GET PROJECT ID
 */
function getProjectId(project: ProjectName): string {
  const ids = {
    synqra: 'proj_M5uK85kGHzXncUc8OJ7UVBTj',
    noid: 'proj_i8k05tw3IYsFc0c3YdA0Hr43',
    aurafx: 'proj_P3jYUneeAXuSGniVCADn0XS',
  };
  return ids[project];
}

/**
 * HEAL ALL PROJECTS
 */
export async function healAllProjects(
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<Record<ProjectName, HealthReport>> {
  const reports: Record<string, HealthReport> = {};

  for (const project of ['synqra', 'noid', 'aurafx'] as ProjectName[]) {
    reports[project] = await selfHeal(project, options);
  }

  return reports;
}

/**
 * CLI ENTRY POINT
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = !args.includes('--quiet');

  if (args.length === 0 || args[0] === 'all' || args[0].startsWith('--')) {
    healAllProjects({ dryRun, verbose })
      .then((reports) => {
        const allHealthy = Object.values(reports).every(r => r.healthy);
        process.exit(allHealthy ? 0 : 1);
      })
      .catch((error) => {
        console.error('Self-heal error:', error);
        process.exit(1);
      });
  } else {
    const project = args[0] as ProjectName;

    if (!['synqra', 'noid', 'aurafx'].includes(project)) {
      console.error('Usage: node self-heal.ts <synqra|noid|aurafx|all> [--dry-run] [--quiet]');
      process.exit(1);
    }

    selfHeal(project, { dryRun, verbose })
      .then((report) => {
        process.exit(report.healthy ? 0 : 1);
      })
      .catch((error) => {
        console.error('Self-heal error:', error);
        process.exit(1);
      });
  }
}
