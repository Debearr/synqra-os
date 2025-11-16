#!/usr/bin/env node

/**
 * ============================================================
 * CONTEXT COMPRESSION MANAGER
 * ============================================================
 * Automatically manages context state and compression
 * Preserves critical system information
 * Enables zero-drift context management
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CONTEXT_STATE_PATH = path.join(__dirname, 'context_state.md');
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

// Critical patterns that must be preserved
const CRITICAL_PATTERNS = {
  brandDNA: ['RPRD', 'refined', 'premium', 'rebellious', 'disruptive', 'De Bear'],
  costs: ['budget', 'guardrail', '$200', 'monthly', 'daily', 'hourly', 'cost'],
  routing: ['route', 'complexity', 'simple', 'medium', 'high', 'creative'],
  models: ['llama', 'claude', 'deepseek', 'gpt', 'bge', 'distilbert'],
  quality: ['quality', 'validation', 'score', 'threshold', 'escalate'],
  learning: ['self-learning', 'optimization', 'metrics', 'drift'],
};

/**
 * Read current context state
 */
async function readContextState() {
  try {
    const content = await fs.readFile(CONTEXT_STATE_PATH, 'utf-8');
    return content;
  } catch (error) {
    console.error('❌ Failed to read context state:', error.message);
    return null;
  }
}

/**
 * Update context state with new information
 */
async function updateContextState(updates) {
  try {
    let currentState = await readContextState();
    
    if (!currentState) {
      console.error('❌ Cannot update - context state not found');
      return false;
    }
    
    // Parse updates and merge
    for (const [section, content] of Object.entries(updates)) {
      const sectionRegex = new RegExp(`## ${section}[\\s\\S]*?(?=##|$)`, 'g');
      
      if (currentState.match(sectionRegex)) {
        // Update existing section
        currentState = currentState.replace(sectionRegex, `## ${section}\n\n${content}\n\n`);
      } else {
        // Append new section
        currentState += `\n\n## ${section}\n\n${content}\n`;
      }
    }
    
    // Update timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    currentState = currentState.replace(
      /\*\*Last Updated:\*\* .*/,
      `**Last Updated:** ${timestamp}`
    );
    
    await fs.writeFile(CONTEXT_STATE_PATH, currentState);
    console.log('✅ Context state updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update context state:', error.message);
    return false;
  }
}

/**
 * Verify critical information is preserved
 */
function verifyCriticalInfo(content) {
  const missing = [];
  
  for (const [category, keywords] of Object.entries(CRITICAL_PATTERNS)) {
    const found = keywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!found) {
      missing.push(category);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Compress context by removing verbose sections
 */
async function compressContext() {
  try {
    console.log('🔄 Starting context compression...');
    
    let content = await readContextState();
    
    if (!content) {
      console.error('❌ No context state to compress');
      return false;
    }
    
    const originalSize = content.length;
    
    // Verify critical info before compression
    const beforeCheck = verifyCriticalInfo(content);
    if (!beforeCheck.valid) {
      console.warn('⚠️  Warning: Missing critical info before compression:', beforeCheck.missing);
    }
    
    // Compression operations (preserve structure, remove verbosity)
    
    // 1. Reduce example code blocks (keep signatures only)
    content = content.replace(/```typescript\n[\s\S]*?```/g, (match) => {
      const lines = match.split('\n');
      if (lines.length > 15) {
        // Keep first 5 and last 2 lines
        return lines.slice(0, 7).join('\n') + '\n// ... (content compressed)\n' + lines.slice(-3).join('\n');
      }
      return match;
    });
    
    // 2. Reduce repetitive lists (keep first 3 items + summary)
    content = content.replace(/(\n- .*\n){6,}/g, (match) => {
      const items = match.trim().split('\n');
      return items.slice(0, 3).join('\n') + `\n- ... (${items.length - 3} more items)\n`;
    });
    
    // 3. Remove excessive whitespace
    content = content.replace(/\n{4,}/g, '\n\n\n');
    
    // Verify critical info after compression
    const afterCheck = verifyCriticalInfo(content);
    if (!afterCheck.valid) {
      console.error('❌ CRITICAL INFO LOST during compression:', afterCheck.missing);
      console.error('🚫 ABORTING compression - original preserved');
      return false;
    }
    
    // Save compressed version
    await fs.writeFile(CONTEXT_STATE_PATH, content);
    
    const newSize = content.length;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log('✅ Context compression complete');
    console.log(`   Original: ${originalSize} chars`);
    console.log(`   Compressed: ${newSize} chars`);
    console.log(`   Savings: ${savings}%`);
    console.log('   Critical info: ✅ Preserved');
    
    return true;
  } catch (error) {
    console.error('❌ Compression failed:', error.message);
    return false;
  }
}

/**
 * Generate context summary for quick reference
 */
async function generateQuickSummary() {
  try {
    const content = await readContextState();
    
    if (!content) {
      return null;
    }
    
    const summary = {
      brand: 'RPRD DNA: Refined, Premium, Rebellious, Disruptive',
      voice: 'De Bear: Natural, short sentences, confident',
      apps: 'Synqra (content), NØID (driver), AuraFX (trading)',
      budget: '$200/month hard limit, alert at 70/85/95%',
      routing: 'Simple→Llama(60%), Medium→DeepSeek(20%), High→Claude(20%)',
      quality: 'Deliver(>0.8), Rephrase(0.6-0.8), Escalate(<0.6)',
      target: 'Under $40/month, 80% local, >0.75 quality',
      status: 'Architecture complete, Python service pending',
    };
    
    return summary;
  } catch (error) {
    console.error('❌ Failed to generate summary:', error.message);
    return null;
  }
}

/**
 * Main CLI
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'read':
      const content = await readContextState();
      if (content) {
        console.log(content);
      }
      break;
      
    case 'verify':
      const state = await readContextState();
      if (state) {
        const check = verifyCriticalInfo(state);
        if (check.valid) {
          console.log('✅ All critical information present');
        } else {
          console.error('❌ Missing critical info:', check.missing);
        }
      }
      break;
      
    case 'compress':
      await compressContext();
      break;
      
    case 'summary':
      const summary = await generateQuickSummary();
      if (summary) {
        console.log('\n📋 QUICK SUMMARY\n');
        for (const [key, value] of Object.entries(summary)) {
          console.log(`${key.padEnd(10)}: ${value}`);
        }
      }
      break;
      
    case 'update':
      console.log('📝 Update context state by editing:');
      console.log(`   ${CONTEXT_STATE_PATH}`);
      break;
      
    default:
      console.log(`
🧠 Context Compression Manager

Usage:
  node context_manager.mjs [command]

Commands:
  read      - Read current context state
  verify    - Verify critical information is present
  compress  - Compress context (preserve critical info)
  summary   - Generate quick summary
  update    - Show path to update context

Examples:
  node context_manager.mjs summary
  node context_manager.mjs verify
  node context_manager.mjs compress
      `);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use as module
export {
  readContextState,
  updateContextState,
  compressContext,
  verifyCriticalInfo,
  generateQuickSummary,
};
