#!/usr/bin/env node
/**
 * ============================================================
 * REPOSITORY INITIALIZATION SCRIPT
 * ============================================================
 * Automates setup for Synqra, NØID, or AuraFX projects
 * - Validates project structure
 * - Copies environment templates
 * - Initializes guardrails
 * - Sets up dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

type ProjectName = 'synqra' | 'noid' | 'aurafx';

interface InitOptions {
  project: ProjectName;
  force?: boolean;
  skipDeps?: boolean;
}

const PROJECT_CONFIGS = {
  synqra: {
    name: 'Synqra',
    projectId: 'proj_M5uK85kGHzXncUc8OJ7UVBTj',
    port: 3004,
    description: 'AI-powered content generation platform',
  },
  noid: {
    name: 'NØID',
    projectId: 'proj_i8k05tw3IYsFc0c3YdA0Hr43',
    port: 3005,
    description: 'Digital identity and card management system',
  },
  aurafx: {
    name: 'AuraFX',
    projectId: 'proj_P3jYUneeAXuSGniVCADn0XS',
    port: 3006,
    description: 'Premium visual effects and brand consistency platform',
  },
};

/**
 * MAIN INITIALIZATION FUNCTION
 */
export async function initRepo(options: InitOptions): Promise<void> {
  const { project, force = false, skipDeps = false } = options;
  const config = PROJECT_CONFIGS[project];

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  🚀 Initializing ${config.name} Repository`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const steps = [
    () => validateWorkspace(),
    () => createProjectStructure(project, force),
    () => copyEnvironmentTemplate(project, force),
    () => setupGuardrails(project),
    () => generateProjectConfig(project),
    () => !skipDeps && installDependencies(project),
    () => runInitialValidation(project),
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step) {
      try {
        await step();
      } catch (error) {
        console.error(`\n❌ Step ${i + 1} failed:`, error);
        throw error;
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ ${config.name} repository initialized successfully!`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Copy real API keys to /${project}/.env.local`);
  console.log(`  2. Run: npm run validate-env ${project}`);
  console.log(`  3. Start development: cd ${project} && npm run dev`);
  console.log('');
}

/**
 * STEP 1: Validate workspace
 */
function validateWorkspace(): void {
  console.log('📋 Step 1: Validating workspace...');
  
  const workspaceRoot = process.cwd();
  const requiredDirs = ['shared', 'scripts'];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(workspaceRoot, dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Required directory not found: ${dir}`);
    }
  }
  
  console.log('   ✅ Workspace validated');
}

/**
 * STEP 2: Create project structure
 */
function createProjectStructure(project: ProjectName, force: boolean): void {
  console.log(`📁 Step 2: Creating ${project} project structure...`);
  
  const projectRoot = path.join(process.cwd(), project);
  
  if (fs.existsSync(projectRoot) && !force) {
    console.log(`   ℹ️  Project directory already exists: ${project}/`);
    return;
  }

  const dirs = [
    '',
    'config',
    'lib',
    'lib/api',
    'lib/models',
    'lib/utils',
    'scripts',
    'docs',
    'tests',
    '.github',
    '.github/workflows',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
  
  console.log(`   ✅ Created directory structure at ${project}/`);
}

/**
 * STEP 3: Copy environment template
 */
function copyEnvironmentTemplate(project: ProjectName, force: boolean): void {
  console.log('🔑 Step 3: Setting up environment configuration...');
  
  const projectRoot = path.join(process.cwd(), project);
  const envExamplePath = path.join(projectRoot, '.env.example');
  const envLocalPath = path.join(projectRoot, '.env.local');
  
  // .env.example should already exist (created earlier)
  if (!fs.existsSync(envExamplePath)) {
    console.log('   ⚠️  .env.example not found, skipping...');
    return;
  }

  // Create .env.local if it doesn't exist
  if (!fs.existsSync(envLocalPath) || force) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log(`   ✅ Created ${project}/.env.local (add your real keys)`);
  } else {
    console.log('   ℹ️  .env.local already exists (preserved)');
  }

  // Create .gitignore if needed
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
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
  }
}

/**
 * STEP 4: Setup guardrails
 */
function setupGuardrails(project: ProjectName): void {
  console.log('🛡️  Step 4: Initializing project guardrails...');
  
  const projectRoot = path.join(process.cwd(), project);
  const config = PROJECT_CONFIGS[project];
  
  const guardrailConfig = {
    project: project,
    projectId: config.projectId,
    initialized: new Date().toISOString(),
    guardrails: {
      projectIsolation: true,
      budgetTracking: true,
      apiKeyValidation: true,
      dataControls: true,
    },
  };

  const configPath = path.join(projectRoot, 'config', 'guardrails.json');
  fs.writeFileSync(configPath, JSON.stringify(guardrailConfig, null, 2));
  
  console.log('   ✅ Guardrails initialized');
}

/**
 * STEP 5: Generate project configuration
 */
function generateProjectConfig(project: ProjectName): void {
  console.log('⚙️  Step 5: Generating project configuration...');
  
  const projectRoot = path.join(process.cwd(), project);
  const config = PROJECT_CONFIGS[project];
  
  const projectConfig = {
    name: config.name,
    projectId: config.projectId,
    port: config.port,
    description: config.description,
    version: '1.0.0',
    created: new Date().toISOString(),
    aiRouting: {
      localPercentage: 80,
      externalPercentage: 20,
      enableBrandCheck: true,
      enableToxicityFilter: true,
    },
    budget: {
      monthly: project === 'aurafx' ? 500 : project === 'synqra' ? 300 : 250,
      alertThreshold: 0.80,
      lockThreshold: 0.95,
    },
  };

  const configPath = path.join(projectRoot, 'config', 'project.json');
  fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));
  
  console.log('   ✅ Project configuration generated');
}

/**
 * STEP 6: Install dependencies
 */
function installDependencies(project: ProjectName): void {
  console.log('📦 Step 6: Installing dependencies...');
  
  const projectRoot = path.join(process.cwd(), project);
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    const config = PROJECT_CONFIGS[project];
    const packageJson = {
      name: `@noid-labs/${project}`,
      version: '1.0.0',
      description: config.description,
      private: true,
      scripts: {
        dev: 'next dev -p ' + config.port,
        build: 'next build',
        start: 'next start -p ' + config.port,
        lint: 'eslint . --ext .ts,.tsx',
        validate: 'node ../scripts/validation/validate-env.ts',
      },
      dependencies: {},
      devDependencies: {
        '@types/node': '^22.9.0',
        'typescript': '^5.6.3',
      },
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✅ Created package.json');
  }
  
  try {
    console.log('   📥 Running npm install...');
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('   ✅ Dependencies installed');
  } catch (error) {
    console.warn('   ⚠️  npm install failed (may need manual installation)');
  }
}

/**
 * STEP 7: Run initial validation
 */
function runInitialValidation(project: ProjectName): void {
  console.log('✔️  Step 7: Running initial validation...');
  
  const config = PROJECT_CONFIGS[project];
  
  // Check critical files
  const projectRoot = path.join(process.cwd(), project);
  const criticalFiles = [
    '.env.example',
    '.env.local',
    '.gitignore',
    'config/guardrails.json',
    'config/project.json',
  ];

  let allFilesPresent = true;
  for (const file of criticalFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  Missing: ${file}`);
      allFilesPresent = false;
    }
  }

  if (allFilesPresent) {
    console.log('   ✅ All critical files present');
  } else {
    throw new Error('Some critical files are missing');
  }
}

/**
 * CLI ENTRY POINT
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectArg = args[0] as ProjectName;
  
  if (!projectArg || !['synqra', 'noid', 'aurafx'].includes(projectArg)) {
    console.error('Usage: node init-repo.ts <synqra|noid|aurafx> [--force] [--skip-deps]');
    process.exit(1);
  }

  const options: InitOptions = {
    project: projectArg,
    force: args.includes('--force'),
    skipDeps: args.includes('--skip-deps'),
  };

  initRepo(options)
    .then(() => {
      console.log('✨ Initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}
