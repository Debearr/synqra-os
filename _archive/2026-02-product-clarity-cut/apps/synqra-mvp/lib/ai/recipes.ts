/**
 * ============================================================
 * CONTENT RECIPES SYSTEM
 * ============================================================
 * Loads and executes content recipe templates.
 * 
 * HUMAN-IN-COMMAND: All recipe executions require explicit confirmation.
 */

import { executeTask } from './router';
import { AITask, ModelProvider, ConfirmationGate } from './types';
import fs from 'fs';
import path from 'path';

export interface Recipe {
  id: string;
  name: string;
  category: string;
  complexity: number;
  recommendedModel: ModelProvider;
  estimatedCost: number;
  template: string;
  variables: string[];
  version: string;
}

export interface RecipeExecution {
  recipe: Recipe;
  variables: Record<string, string>;
  result: unknown;
  actualCost: number;
  generationTime: number;
  qualityScore?: number;
}

/**
 * LOAD RECIPE FROM FILE
 */
export function loadRecipe(recipeId: string): Recipe | null {
  const recipesDir = path.join(process.cwd(), 'content_recipes');
  
  // Search for recipe file
  const recipeFiles = [
    `${recipeId}.md`,
    `campaigns/${recipeId}.md`,
    `social/${recipeId}.md`,
    `landing_pages/${recipeId}.md`,
    `emails/${recipeId}.md`,
    `blueprints/${recipeId}.md`,
  ];
  
  for (const file of recipeFiles) {
    const filePath = path.join(recipesDir, file);
    if (fs.existsSync(filePath)) {
      const template = fs.readFileSync(filePath, 'utf-8');
      return parseRecipe(recipeId, template);
    }
  }
  
  return null;
}

/**
 * PARSE RECIPE FROM MARKDOWN
 */
function parseRecipe(id: string, markdown: string): Recipe {
  // Extract metadata from markdown
  const lines = markdown.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || id;
  
  // Extract variables ({{VARIABLE_NAME}})
  const variableRegex = /\{\{([A-Z_]+)\}\}/g;
  const variables = [...new Set([...markdown.matchAll(variableRegex)].map(m => m[1]))];
  
  // Extract AI Router config if present
  const configMatch = markdown.match(/```typescript\n\{[\s\S]*?\}/);
  const complexity = 0.5;
  let recommendedModel: ModelProvider = 'mistral';
  let estimatedCost = 0.001;
  
  if (configMatch) {
    try {
      const config = configMatch[0].replace('```typescript\n', '').replace('```', '');
      // Parse config (simplified - would need proper parsing in production)
      if (config.includes("'claude'")) recommendedModel = 'claude';
      if (config.includes("'gpt-5'")) recommendedModel = 'gpt-5';
      if (config.includes("'deepseek'")) recommendedModel = 'deepseek';
      
      const costMatch = config.match(/maxBudget:\s*([\d.]+)/);
      if (costMatch) estimatedCost = parseFloat(costMatch[1]);
    } catch (err) {
      console.warn('Failed to parse recipe config:', err);
    }
  }
  
  // Determine category from title/content
  let category = 'general';
  if (markdown.toLowerCase().includes('campaign')) category = 'campaigns';
  if (markdown.toLowerCase().includes('landing')) category = 'landing_pages';
  if (markdown.toLowerCase().includes('email')) category = 'emails';
  if (markdown.toLowerCase().includes('social')) category = 'social';
  
  return {
    id,
    name: title,
    category,
    complexity,
    recommendedModel,
    estimatedCost,
    template: markdown,
    variables,
    version: '1.0',
  };
}

/**
 * EXECUTE RECIPE
 * 
 * HUMAN-IN-COMMAND: Requires explicit confirmation gate.
 */
export async function executeRecipe(
  recipeId: string,
  variables: Record<string, string>,
  confirmation: ConfirmationGate,
  options?: {
    maxBudget?: number;
    model?: ModelProvider;
    cacheKey?: string;
  }
): Promise<RecipeExecution> {
  const startTime = Date.now();
  
  // Load recipe
  const recipe = loadRecipe(recipeId);
  if (!recipe) {
    throw new Error(`Recipe not found: ${recipeId}`);
  }
  
  // Replace variables in template
  let processedTemplate = recipe.template;
  for (const [key, value] of Object.entries(variables)) {
    processedTemplate = processedTemplate.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      value
    );
  }
  
  // Build input from variables
  const input = Object.entries(variables)
    .map(([key, value]) => `${key}: "${value}"`)
    .join('\n');
  
  // Build task
  const task: AITask = {
    type: 'generation',
    input,
    systemPrompt: processedTemplate,
    isClientFacing: true,
    requiresReasoning: recipe.complexity > 0.7,
    requiresStructuredOutput: true,
    maxBudget: options?.maxBudget || recipe.estimatedCost * 1.5,
    model: options?.model || recipe.recommendedModel,
    cacheKey: options?.cacheKey || `recipe-${recipeId}-${hashVariables(variables)}`,
    confirmation, // HUMAN-IN-COMMAND: Require confirmation
  };
  
  // Execute
  const result = await executeTask(task);
  
  const generationTime = Date.now() - startTime;
  
  return {
    recipe,
    variables,
    result,
    actualCost: 0, // Would be tracked by logging system
    generationTime,
  };
}

/**
 * HASH VARIABLES FOR CACHE KEY
 */
function hashVariables(variables: Record<string, string>): string {
  const str = JSON.stringify(variables);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * LIST ALL RECIPES
 */
export function listRecipes(): Recipe[] {
  const recipesDir = path.join(process.cwd(), 'content_recipes');
  
  if (!fs.existsSync(recipesDir)) {
    return [];
  }
  
  const recipes: Recipe[] = [];
  
  // Scan directories
  const scanDir = (dir: string, category: string) => {
    void category;
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'README.md') {
        const id = file.replace('.md', '');
        const recipe = loadRecipe(id);
        if (recipe) {
          recipes.push(recipe);
        }
      }
    }
  };
  
  // Scan all category directories
  scanDir(recipesDir, 'general');
  scanDir(path.join(recipesDir, 'campaigns'), 'campaigns');
  scanDir(path.join(recipesDir, 'social'), 'social');
  scanDir(path.join(recipesDir, 'landing_pages'), 'landing_pages');
  scanDir(path.join(recipesDir, 'emails'), 'emails');
  scanDir(path.join(recipesDir, 'blueprints'), 'blueprints');
  
  return recipes;
}

/**
 * SEARCH RECIPES
 */
export function searchRecipes(query: string): Recipe[] {
  const allRecipes = listRecipes();
  const lowerQuery = query.toLowerCase();
  
  return allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.category.toLowerCase().includes(lowerQuery) ||
    recipe.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * GET RECIPE STATS
 */
export async function getRecipeStats(
  recipeId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalUses: number;
  avgCost: number;
  cacheHitRate: number;
  avgQualityScore: number;
}> {
  void recipeId;
  void options;
  // This would query Supabase ai_model_usage table
  // For now, return mock data
  return {
    totalUses: 0,
    avgCost: 0,
    cacheHitRate: 0,
    avgQualityScore: 0,
  };
}

/**
 * TEST RECIPE
 * 
 * HUMAN-IN-COMMAND: Requires explicit confirmation gate.
 */
export async function testRecipe(
  recipeId: string,
  variables: Record<string, string>,
  confirmation: ConfirmationGate
): Promise<RecipeExecution> {
  console.log(`🧪 Testing recipe: ${recipeId}`);
  
  const result = await executeRecipe(recipeId, variables, confirmation);
  
  console.log(`✅ Recipe test complete:`);
  console.log(`   Time: ${result.generationTime}ms`);
  console.log(`   Cost: $${result.actualCost.toFixed(4)}`);
  
  return result;
}
