/**
 * ============================================================
 * PROJECT ISOLATION GUARDRAILS
 * ============================================================
 * Enforces strict project boundaries across Synqra, NØID, AuraFX
 * - Prevents cross-repo key usage
 * - Validates project IDs
 * - Enforces data control policies
 * - Blocks accidental boundary violations
 */

export type ProjectName = 'synqra' | 'noid' | 'aurafx';

export interface ProjectConfig {
  name: ProjectName;
  projectId: string;
  allowFreeEvals: boolean;
  dataSharing: boolean;
  privacyMode: 'standard' | 'maximum';
  budgetLimits: {
    monthly: number;
    daily: number;
    hourly: number;
    perRequest: number;
  };
}

/**
 * PROJECT DEFINITIONS
 * Immutable project configurations
 */
export const PROJECTS: Record<ProjectName, ProjectConfig> = {
  synqra: {
    name: 'synqra',
    projectId: 'proj_M5uK85kGHzXncUc8OJ7UVBTj',
    allowFreeEvals: true,
    dataSharing: false,
    privacyMode: 'standard',
    budgetLimits: {
      monthly: 300,
      daily: 10,
      hourly: 1.0,
      perRequest: 0.05,
    },
  },
  noid: {
    name: 'noid',
    projectId: 'proj_i8k05tw3IYsFc0c3YdA0Hr43',
    allowFreeEvals: true,
    dataSharing: false,
    privacyMode: 'standard',
    budgetLimits: {
      monthly: 250,
      daily: 8.5,
      hourly: 0.75,
      perRequest: 0.04,
    },
  },
  aurafx: {
    name: 'aurafx',
    projectId: 'proj_P3jYUneeAXuSGniVCADn0XS',
    allowFreeEvals: false, // FULLY PRIVATE
    dataSharing: false,
    privacyMode: 'maximum',
    budgetLimits: {
      monthly: 500,
      daily: 17,
      hourly: 1.5,
      perRequest: 0.10,
    },
  },
};

/**
 * VALIDATION ERRORS
 */
export class ProjectIsolationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProjectIsolationError';
  }
}

/**
 * VALIDATE PROJECT CONTEXT
 * Ensures the current environment matches the expected project
 */
export function validateProjectContext(expectedProject: ProjectName): void {
  const currentProjectId = process.env.OPENAI_PROJECT_ID || process.env.PROJECT_ID;
  const expectedConfig = PROJECTS[expectedProject];

  if (!currentProjectId) {
    throw new ProjectIsolationError(
      'No project ID found in environment',
      'MISSING_PROJECT_ID',
      { expectedProject }
    );
  }

  if (currentProjectId !== expectedConfig.projectId) {
    throw new ProjectIsolationError(
      `Project ID mismatch: Expected ${expectedProject} (${expectedConfig.projectId}) but found ${currentProjectId}`,
      'PROJECT_ID_MISMATCH',
      {
        expectedProject,
        expectedProjectId: expectedConfig.projectId,
        actualProjectId: currentProjectId,
      }
    );
  }
}

/**
 * GET CURRENT PROJECT
 * Detects which project is currently active
 */
export function getCurrentProject(): ProjectConfig | null {
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.PROJECT_ID;
  
  if (!projectId) {
    return null;
  }

  const project = Object.values(PROJECTS).find(p => p.projectId === projectId);
  return project || null;
}

/**
 * VALIDATE API KEY SCOPE
 * Ensures API keys are only used within their designated project
 */
export function validateApiKeyScope(apiKey: string, project: ProjectName): void {
  // Check for project prefix in key (OpenAI format: sk-proj-{project}-...)
  if (apiKey.startsWith('sk-proj-')) {
    const keyProjectMatch = apiKey.match(/sk-proj-(\w+)-/);
    if (keyProjectMatch) {
      const keyProject = keyProjectMatch[1];
      if (keyProject !== project) {
        throw new ProjectIsolationError(
          `API key project mismatch: Key is for "${keyProject}" but current project is "${project}"`,
          'API_KEY_PROJECT_MISMATCH',
          { keyProject, currentProject: project }
        );
      }
    }
  }

  // Additional validation: Check PROJECT_ID environment variable
  const envProjectId = process.env.OPENAI_PROJECT_ID || process.env.PROJECT_ID;
  const expectedProjectId = PROJECTS[project].projectId;

  if (envProjectId && envProjectId !== expectedProjectId) {
    throw new ProjectIsolationError(
      `Environment project ID does not match expected project "${project}"`,
      'ENV_PROJECT_MISMATCH',
      { envProjectId, expectedProjectId }
    );
  }
}

/**
 * ENFORCE DATA CONTROLS
 * Validates data sharing and privacy settings
 */
export function enforceDataControls(project: ProjectName): void {
  const config = PROJECTS[project];

  // Validate free evals setting
  const allowFreeEvals = process.env.OPENAI_ALLOW_FREE_EVALS === 'true';
  if (allowFreeEvals !== config.allowFreeEvals) {
    throw new ProjectIsolationError(
      `Data control violation: Free evals setting mismatch for ${project}`,
      'FREE_EVALS_MISMATCH',
      {
        expected: config.allowFreeEvals,
        actual: allowFreeEvals,
      }
    );
  }

  // Validate data sharing (should always be false)
  const dataSharing = process.env.OPENAI_DATA_SHARING === 'true';
  if (dataSharing !== config.dataSharing) {
    throw new ProjectIsolationError(
      `Data control violation: Data sharing must be disabled for ${project}`,
      'DATA_SHARING_VIOLATION',
      { project }
    );
  }

  // AuraFX specific: Maximum privacy mode
  if (project === 'aurafx') {
    const zeroRetention = process.env.OPENAI_ZERO_DATA_RETENTION === 'true';
    if (!zeroRetention) {
      throw new ProjectIsolationError(
        'AuraFX requires zero data retention mode',
        'AURAFX_PRIVACY_VIOLATION'
      );
    }
  }
}

/**
 * CHECK BUDGET COMPLIANCE
 * Ensures cost stays within project limits
 */
export function checkBudgetCompliance(
  project: ProjectName,
  cost: number,
  period: 'monthly' | 'daily' | 'hourly' | 'perRequest'
): boolean {
  const config = PROJECTS[project];
  const limit = config.budgetLimits[period];

  if (cost > limit) {
    throw new ProjectIsolationError(
      `Budget exceeded for ${project}: ${cost} > ${limit} (${period})`,
      'BUDGET_EXCEEDED',
      {
        project,
        cost,
        limit,
        period,
      }
    );
  }

  return true;
}

/**
 * SAFE ENV LOADER
 * Loads environment variables with validation
 */
export function loadProjectEnv(project: ProjectName): Record<string, string> {
  // Validate project context first
  validateProjectContext(project);
  enforceDataControls(project);

  const config = PROJECTS[project];
  const env: Record<string, string> = {};

  // Required variables
  const required = [
    'OPENAI_PROJECT_ID',
    'ANTHROPIC_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      throw new ProjectIsolationError(
        `Missing required environment variable: ${key}`,
        'MISSING_ENV_VAR',
        { project, key }
      );
    }
    env[key] = value;
  }

  // Optional but validated if present
  if (process.env.OPENAI_API_KEY) {
    validateApiKeyScope(process.env.OPENAI_API_KEY, project);
    env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }

  return env;
}

/**
 * CREATE PROJECT GUARD
 * Middleware factory for project-specific guards
 */
export function createProjectGuard(project: ProjectName) {
  return {
    /**
     * Validate and initialize project context
     */
    init: () => {
      validateProjectContext(project);
      enforceDataControls(project);
      console.log(`✅ Project guard initialized: ${project}`);
    },

    /**
     * Validate API request
     */
    validateRequest: (cost: number) => {
      checkBudgetCompliance(project, cost, 'perRequest');
    },

    /**
     * Get project configuration
     */
    getConfig: () => PROJECTS[project],

    /**
     * Check if feature is allowed
     */
    isFeatureAllowed: (feature: 'freeEvals' | 'dataSharing') => {
      const config = PROJECTS[project];
      switch (feature) {
        case 'freeEvals':
          return config.allowFreeEvals;
        case 'dataSharing':
          return config.dataSharing;
        default:
          return false;
      }
    },
  };
}

/**
 * AUDIT LOG
 * Logs boundary violations and access attempts
 */
export interface AuditEntry {
  timestamp: string;
  project: ProjectName;
  action: string;
  success: boolean;
  error?: string;
  metadata?: any;
}

const auditLog: AuditEntry[] = [];

export function logAudit(entry: Omit<AuditEntry, 'timestamp'>): void {
  const fullEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  auditLog.push(fullEntry);
  
  // In production, send to Supabase or logging service
  if (process.env.NODE_ENV === 'production') {
    console.log('[AUDIT]', JSON.stringify(fullEntry));
  }
}

export function getAuditLog(project?: ProjectName): AuditEntry[] {
  if (project) {
    return auditLog.filter(e => e.project === project);
  }
  return [...auditLog];
}

/**
 * EXPORT GUARDS FOR EACH PROJECT
 */
export const synqraGuard = createProjectGuard('synqra');
export const noidGuard = createProjectGuard('noid');
export const aurafxGuard = createProjectGuard('aurafx');
