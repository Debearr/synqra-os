import { z } from "zod";
import { ToolDefinition } from "../base/types";

/**
 * ============================================================
 * AGENT TOOLS
 * ============================================================
 * Tool definitions for Claude function calling
 */

/**
 * Tool: Search Knowledge Base
 */
export const searchKnowledgeBaseTool: ToolDefinition = {
  name: "search_knowledge_base",
  description:
    "Search the Synqra knowledge base for relevant documentation, guides, or information. Use this when you need to find specific product information, features, pricing, or best practices.",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant information"),
    category: z
      .enum(["features", "pricing", "integrations", "support", "general"])
      .optional()
      .describe("Optional category to narrow the search"),
  }),
  handler: async (args: { query: string; category?: string }) => {
    // TODO: Implement actual knowledge base search with RAG
    // For now, return mock results
    return {
      results: [
        {
          title: "Getting Started with Synqra",
          content:
            "Synqra is a comprehensive business automation platform...",
          source: "/docs/getting-started",
          relevance: 0.95,
        },
      ],
      query: args.query,
      category: args.category || "general",
    };
  },
};

/**
 * Tool: Get Pricing Information
 */
export const getPricingTool: ToolDefinition = {
  name: "get_pricing",
  description:
    "Retrieve pricing information for Synqra plans. Use this when discussing costs, plan features, or comparing tiers.",
  parameters: z.object({
    planType: z
      .enum(["starter", "professional", "enterprise", "all"])
      .optional()
      .describe("Specific plan to get pricing for, or 'all' for comparison"),
  }),
  handler: async (args: { planType?: string }) => {
    // Mock pricing data
    const pricing = {
      starter: {
        name: "Starter",
        price: "$29/month",
        features: [
          "Up to 5 users",
          "Basic integrations",
          "Email support",
          "1GB storage",
        ],
      },
      professional: {
        name: "Professional",
        price: "$99/month",
        features: [
          "Up to 25 users",
          "Advanced integrations",
          "Priority support",
          "10GB storage",
          "Custom workflows",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom pricing",
        features: [
          "Unlimited users",
          "All integrations",
          "24/7 dedicated support",
          "Unlimited storage",
          "Custom development",
          "SLA guarantee",
        ],
      },
    };

    if (args.planType && args.planType !== "all") {
      return pricing[args.planType as keyof typeof pricing];
    }

    return pricing;
  },
};

/**
 * Tool: Create Support Ticket
 */
export const createSupportTicketTool: ToolDefinition = {
  name: "create_support_ticket",
  description:
    "Create a support ticket for technical issues or customer requests. Use this when a customer reports a problem that requires technical investigation.",
  parameters: z.object({
    title: z.string().describe("Brief title describing the issue"),
    description: z.string().describe("Detailed description of the issue"),
    priority: z
      .enum(["low", "medium", "high", "critical"])
      .describe("Priority level based on issue severity"),
    category: z
      .enum(["bug", "feature_request", "integration", "performance", "other"])
      .describe("Category of the issue"),
    customerEmail: z.string().optional().describe("Customer's email address"),
  }),
  handler: async (args: {
    title: string;
    description: string;
    priority: string;
    category: string;
    customerEmail?: string;
  }) => {
    // TODO: Integrate with actual ticketing system (Zendesk, Intercom, etc.)
    const ticketId = `SYNQ-${Date.now().toString().slice(-6)}`;

    return {
      ticketId,
      status: "created",
      title: args.title,
      priority: args.priority,
      category: args.category,
      message:
        "Support ticket created successfully. Our team will respond within 24 hours.",
    };
  },
};

/**
 * Tool: Check System Status
 */
export const checkSystemStatusTool: ToolDefinition = {
  name: "check_system_status",
  description:
    "Check the current status of Synqra services and integrations. Use this when customers report issues or ask about service availability.",
  parameters: z.object({
    service: z
      .enum(["api", "dashboard", "integrations", "all"])
      .optional()
      .describe("Specific service to check, or 'all' for full status"),
  }),
  handler: async (args: { service?: string }) => {
    // Mock status data
    const status = {
      api: {
        status: "operational",
        uptime: "99.99%",
        lastIncident: null,
      },
      dashboard: {
        status: "operational",
        uptime: "99.95%",
        lastIncident: null,
      },
      integrations: {
        status: "operational",
        uptime: "99.98%",
        lastIncident: null,
      },
    };

    if (args.service && args.service !== "all") {
      return status[args.service as keyof typeof status];
    }

    return {
      overall: "operational",
      services: status,
      lastUpdated: new Date().toISOString(),
    };
  },
};

/**
 * Tool: Schedule Demo
 */
export const scheduleDemoTool: ToolDefinition = {
  name: "schedule_demo",
  description:
    "Schedule a product demonstration for a prospect. Use this when a potential customer wants to see Synqra in action.",
  parameters: z.object({
    customerName: z.string().describe("Name of the prospect"),
    customerEmail: z.string().describe("Email address of the prospect"),
    companyName: z.string().optional().describe("Company name"),
    preferredDate: z.string().optional().describe("Preferred date/time"),
    interests: z
      .array(z.string())
      .optional()
      .describe("Specific features or use cases they're interested in"),
  }),
  handler: async (args: {
    customerName: string;
    customerEmail: string;
    companyName?: string;
    preferredDate?: string;
    interests?: string[];
  }) => {
    // TODO: Integrate with calendar system (Calendly, Google Calendar, etc.)
    const demoId = `DEMO-${Date.now().toString().slice(-6)}`;

    return {
      demoId,
      status: "scheduled",
      message:
        "Demo request received! Our sales team will send you a calendar invite within 2 hours.",
      customerName: args.customerName,
      customerEmail: args.customerEmail,
    };
  },
};

/**
 * Tool: Get Account Information
 */
export const getAccountInfoTool: ToolDefinition = {
  name: "get_account_info",
  description:
    "Retrieve account information for a customer. Use this to check subscription status, billing, or account settings.",
  parameters: z.object({
    email: z.string().describe("Customer's email address"),
    infoType: z
      .enum(["subscription", "billing", "usage", "all"])
      .optional()
      .describe("Type of information to retrieve"),
  }),
  handler: async (args: { email: string; infoType?: string }) => {
    // TODO: Integrate with actual user database
    // Mock account data
    return {
      email: args.email,
      plan: "Professional",
      status: "active",
      nextBillingDate: "2025-12-09",
      usage: {
        users: 12,
        storage: "6.2GB",
        apiCalls: "1,240 this month",
      },
    };
  },
};

// Export all tools as an array
export const ALL_TOOLS: ToolDefinition[] = [
  searchKnowledgeBaseTool,
  getPricingTool,
  createSupportTicketTool,
  checkSystemStatusTool,
  scheduleDemoTool,
  getAccountInfoTool,
];

// Export tools by agent role
export const SALES_TOOLS = [
  searchKnowledgeBaseTool,
  getPricingTool,
  scheduleDemoTool,
  getAccountInfoTool,
];

export const SUPPORT_TOOLS = [
  searchKnowledgeBaseTool,
  createSupportTicketTool,
  checkSystemStatusTool,
  getAccountInfoTool,
];

export const SERVICE_TOOLS = [
  searchKnowledgeBaseTool,
  getPricingTool,
  getAccountInfoTool,
  checkSystemStatusTool,
];
