/**
 * ============================================================
 * AUTONOMOUS AGENT MODE
 * ============================================================
 * Enables AI agents to work autonomously with strict guardrails
 * - Create and review PRs
 * - Refactor code safely
 * - Follow project boundaries
 * - Cannot break isolation rules
 * - All actions audited
 */

import {
  getCurrentProject,
  validateProjectContext,
  checkBudgetCompliance,
  logAudit,
  type ProjectName,
} from '../guardrails/project-isolation';
import { route, getRoutingMetrics } from '../ai-router/hybrid-router';

export type AgentAction =
  | 'analyze'
  | 'refactor'
  | 'create-pr'
  | 'review-pr'
  | 'optimize'
  | 'fix-bug'
  | 'add-feature';

export interface AgentTask {
  id: string;
  project: ProjectName;
  action: AgentAction;
  description: string;
  files: string[];
  constraints: {
    maxCost: number;
    maxFilesChanged: number;
    requiresReview: boolean;
    breakingChangesAllowed: boolean;
  };
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  changesProposed: number;
  prUrl?: string;
  cost: number;
  error?: string;
  auditLog: string[];
}

/**
 * AGENT GUARDRAILS
 * Enforces what autonomous agents can and cannot do
 */
const AGENT_GUARDRAILS = {
  // File access restrictions
  allowedPatterns: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
    '**/*.md',
  ],
  forbiddenPatterns: [
    '**/.env*',
    '**/node_modules/**',
    '**/.git/**',
    '**/config/guardrails.json', // Agents cannot modify guardrails
  ],

  // Code change restrictions
  maxFilesPerPR: 10,
  maxLinesPerFile: 500,
  requiresReviewThreshold: 100, // Lines changed

  // Cost restrictions (per task)
  maxCostPerTask: 0.50,
  maxCostPerHour: 5.00,

  // Safety restrictions
  cannotModify: [
    'project-isolation.ts',
    'guardrails.json',
    '.env',
    'package-lock.json',
  ],
  requiresApprovalFor: ['breaking changes', 'API changes', 'schema changes'],
};

/**
 * VALIDATE AGENT TASK
 * Ensures task complies with guardrails
 */
export function validateAgentTask(task: AgentTask): { valid: boolean; reason?: string } {
  // Validate project context
  try {
    validateProjectContext(task.project);
  } catch (error: any) {
    return { valid: false, reason: `Project isolation error: ${error.message}` };
  }

  // Check file count
  if (task.files.length > AGENT_GUARDRAILS.maxFilesPerPR) {
    return {
      valid: false,
      reason: `Too many files (${task.files.length} > ${AGENT_GUARDRAILS.maxFilesPerPR})`,
    };
  }

  // Check for forbidden files
  for (const file of task.files) {
    if (AGENT_GUARDRAILS.cannotModify.some(pattern => file.includes(pattern))) {
      return { valid: false, reason: `Cannot modify protected file: ${file}` };
    }
  }

  // Check cost constraints
  if (task.constraints.maxCost > AGENT_GUARDRAILS.maxCostPerTask) {
    return {
      valid: false,
      reason: `Cost exceeds guardrail (${task.constraints.maxCost} > ${AGENT_GUARDRAILS.maxCostPerTask})`,
    };
  }

  return { valid: true };
}

/**
 * EXECUTE AGENT TASK
 * Runs an autonomous agent task with full safety checks
 */
export async function executeAgentTask(task: AgentTask): Promise<AgentResult> {
  const auditLog: string[] = [];
  let totalCost = 0;

  // Log task start
  logAudit({
    project: task.project,
    action: `agent_task_start`,
    success: true,
    metadata: { taskId: task.id, action: task.action },
  });
  auditLog.push(`Task started: ${task.id} (${task.action})`);

  try {
    // Step 1: Validate task
    const validation = validateAgentTask(task);
    if (!validation.valid) {
      throw new Error(`Task validation failed: ${validation.reason}`);
    }
    auditLog.push('✓ Task validated');

    // Step 2: Analyze files
    const analysis = await analyzeFiles(task);
    auditLog.push(`✓ Analyzed ${task.files.length} files`);
    totalCost += analysis.cost;

    // Step 3: Generate changes
    const changes = await generateChanges(task, analysis);
    auditLog.push(`✓ Generated ${changes.length} proposed changes`);
    totalCost += changes.reduce((sum, c) => sum + c.cost, 0);

    // Step 4: Validate changes don't break isolation
    await validateChanges(task.project, changes);
    auditLog.push('✓ Changes validated (no boundary violations)');

    // Step 5: Check if review is required
    const requiresReview =
      task.constraints.requiresReview ||
      changes.reduce((sum, c) => sum + c.linesChanged, 0) >
        AGENT_GUARDRAILS.requiresReviewThreshold;

    if (requiresReview) {
      auditLog.push('⚠ Changes require human review');
    }

    // Step 6: Create PR (simulated)
    const prUrl = await createPR(task, changes, requiresReview);
    auditLog.push(`✓ PR created: ${prUrl}`);

    // Step 7: Budget check
    checkBudgetCompliance(task.project, totalCost, 'perRequest');
    auditLog.push(`✓ Budget check passed ($${totalCost.toFixed(4)})`);

    // Log success
    logAudit({
      project: task.project,
      action: `agent_task_complete`,
      success: true,
      metadata: {
        taskId: task.id,
        prUrl,
        cost: totalCost,
        changesCount: changes.length,
      },
    });

    return {
      taskId: task.id,
      success: true,
      changesProposed: changes.length,
      prUrl,
      cost: totalCost,
      auditLog,
    };
  } catch (error: any) {
    // Log failure
    logAudit({
      project: task.project,
      action: `agent_task_failed`,
      success: false,
      error: error.message,
      metadata: { taskId: task.id },
    });

    auditLog.push(`✗ Task failed: ${error.message}`);

    return {
      taskId: task.id,
      success: false,
      changesProposed: 0,
      cost: totalCost,
      error: error.message,
      auditLog,
    };
  }
}

/**
 * ANALYZE FILES
 * Uses AI to analyze files within budget constraints
 */
async function analyzeFiles(task: AgentTask): Promise<{ analysis: any; cost: number }> {
  // Route analysis request through hybrid router
  const routingDecision = await route({
    input: `Analyze these files for ${task.action}: ${task.files.join(', ')}. Description: ${task.description}`,
    taskType: 'reasoning',
    complexity: 0.6,
    maxCost: task.constraints.maxCost * 0.3, // Allocate 30% of budget to analysis
  });

  // In production, this would call actual AI model
  const analysis = {
    files: task.files,
    findings: `Analysis completed for ${task.action}`,
    recommendations: [],
  };

  return {
    analysis,
    cost: routingDecision.estimatedCost,
  };
}

/**
 * GENERATE CHANGES
 * Generates proposed code changes
 */
async function generateChanges(
  task: AgentTask,
  analysis: any
): Promise<Array<{ file: string; changes: string; linesChanged: number; cost: number }>> {
  const changes = [];

  for (const file of task.files) {
    // Route change generation through hybrid router
    const routingDecision = await route({
      input: `Generate changes for ${file} to ${task.description}`,
      taskType: 'generation',
      complexity: 0.5,
      maxCost: task.constraints.maxCost * 0.5 / task.files.length,
    });

    changes.push({
      file,
      changes: `// Generated changes for ${task.action}`,
      linesChanged: Math.floor(Math.random() * 50) + 10, // Mock
      cost: routingDecision.estimatedCost,
    });
  }

  return changes;
}

/**
 * VALIDATE CHANGES
 * Ensures changes don't violate project boundaries
 */
async function validateChanges(project: ProjectName, changes: any[]): Promise<void> {
  for (const change of changes) {
    // Check for cross-project imports
    if (change.changes.includes('import') && change.changes.includes('../')) {
      const otherProjects = ['synqra', 'noid', 'aurafx'].filter(p => p !== project);
      for (const otherProject of otherProjects) {
        if (change.changes.includes(otherProject)) {
          throw new Error(
            `Boundary violation: Cannot import from ${otherProject} in ${project}`
          );
        }
      }
    }

    // Check for hardcoded API keys
    if (
      change.changes.includes('sk-') ||
      change.changes.includes('API_KEY') ||
      change.changes.includes('SECRET')
    ) {
      throw new Error('Security violation: Cannot commit API keys or secrets');
    }

    // Check for project ID modifications
    if (
      change.changes.includes('proj_') &&
      !change.changes.includes('OPENAI_PROJECT_ID')
    ) {
      throw new Error('Security violation: Cannot hardcode project IDs');
    }
  }
}

/**
 * CREATE PR
 * Creates a pull request with proposed changes
 */
async function createPR(
  task: AgentTask,
  changes: any[],
  requiresReview: boolean
): Promise<string> {
  // In production, this would use GitHub API
  // For now, return mock PR URL

  const prNumber = Math.floor(Math.random() * 1000) + 100;
  const branchName = `agent/${task.action}/${task.id}`;
  const prUrl = `https://github.com/noid-labs/${task.project}/pull/${prNumber}`;

  console.log('');
  console.log('📝 PR Created:');
  console.log(`   Branch: ${branchName}`);
  console.log(`   URL: ${prUrl}`);
  console.log(`   Files changed: ${changes.length}`);
  console.log(`   Review required: ${requiresReview ? 'YES' : 'NO'}`);
  console.log('');

  return prUrl;
}

/**
 * AGENT TASK BUILDER
 * Helper to create agent tasks with proper validation
 */
export class AgentTaskBuilder {
  private task: Partial<AgentTask>;

  constructor(project: ProjectName) {
    this.task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      project,
      files: [],
      constraints: {
        maxCost: AGENT_GUARDRAILS.maxCostPerTask,
        maxFilesChanged: AGENT_GUARDRAILS.maxFilesPerPR,
        requiresReview: true,
        breakingChangesAllowed: false,
      },
    };
  }

  action(action: AgentAction): this {
    this.task.action = action;
    return this;
  }

  description(description: string): this {
    this.task.description = description;
    return this;
  }

  files(files: string[]): this {
    this.task.files = files;
    return this;
  }

  maxCost(cost: number): this {
    if (this.task.constraints) {
      this.task.constraints.maxCost = Math.min(cost, AGENT_GUARDRAILS.maxCostPerTask);
    }
    return this;
  }

  allowBreakingChanges(): this {
    if (this.task.constraints) {
      this.task.constraints.breakingChangesAllowed = true;
      this.task.constraints.requiresReview = true; // Force review for breaking changes
    }
    return this;
  }

  skipReview(): this {
    if (this.task.constraints) {
      this.task.constraints.requiresReview = false;
    }
    return this;
  }

  build(): AgentTask {
    if (!this.task.action || !this.task.description || !this.task.files) {
      throw new Error('AgentTask incomplete: action, description, and files are required');
    }

    return this.task as AgentTask;
  }
}

/**
 * QUICK AGENT ACTIONS
 * Pre-configured tasks for common operations
 */
export const AgentActions = {
  /**
   * Analyze code quality and suggest improvements
   */
  analyzeCode: (project: ProjectName, files: string[]) =>
    new AgentTaskBuilder(project)
      .action('analyze')
      .description('Analyze code quality and suggest improvements')
      .files(files)
      .maxCost(0.10)
      .build(),

  /**
   * Refactor code for better structure
   */
  refactorCode: (project: ProjectName, files: string[]) =>
    new AgentTaskBuilder(project)
      .action('refactor')
      .description('Refactor code for better structure and maintainability')
      .files(files)
      .maxCost(0.25)
      .build(),

  /**
   * Fix bugs automatically
   */
  fixBug: (project: ProjectName, files: string[], bugDescription: string) =>
    new AgentTaskBuilder(project)
      .action('fix-bug')
      .description(`Fix bug: ${bugDescription}`)
      .files(files)
      .maxCost(0.20)
      .build(),

  /**
   * Optimize performance
   */
  optimize: (project: ProjectName, files: string[]) =>
    new AgentTaskBuilder(project)
      .action('optimize')
      .description('Optimize code for better performance')
      .files(files)
      .maxCost(0.30)
      .build(),

  /**
   * Add new feature
   */
  addFeature: (project: ProjectName, files: string[], featureDescription: string) =>
    new AgentTaskBuilder(project)
      .action('add-feature')
      .description(`Add feature: ${featureDescription}`)
      .files(files)
      .maxCost(0.50)
      .allowBreakingChanges()
      .build(),
};

/**
 * AGENT STATUS
 * Get current agent system status
 */
export function getAgentStatus(): {
  guardrails: typeof AGENT_GUARDRAILS;
  routing: ReturnType<typeof getRoutingMetrics>;
  projects: ProjectName[];
} {
  return {
    guardrails: AGENT_GUARDRAILS,
    routing: getRoutingMetrics(),
    projects: ['synqra', 'noid', 'aurafx'],
  };
}
