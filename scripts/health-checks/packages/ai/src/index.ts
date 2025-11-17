/**
 * ============================================================
 * @noid/ai
 * ============================================================
 * AI orchestration, agents, and content generation
 * 
 * Usage:
 * import { BaseAgent, SalesAgent, ContentGenerator } from '@noid/ai';
 */

// Export agents (all agent types, routing, config)
export * from './agents';
export * from './agents/base/agent';
export * from './agents/base/config';
export * from './agents/base/types';
export * from './agents/sales/salesAgent';
export * from './agents/support/supportAgent';
export * from './agents/service/serviceAgent';
export * from './agents/shared/router';
export * from './agents/shared/memory';
export * from './agents/shared/tools';
export * from './agents/shared/personaPresets';

// Export content generation
export * from './contentGenerator';
export * from './draftEngine';

// Export RAG system
export * from './rag';
export * from './rag/index';
export * from './rag/retrieval';

// Export safety guardrails
export * from './safety';
export * from './safety/index';
export * from './safety/guardrails';
