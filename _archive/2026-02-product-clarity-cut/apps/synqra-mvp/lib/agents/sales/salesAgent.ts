import { BaseAgent } from "../base/agent";
import { AgentConfig, AgentRequest, AgentResponse, Message } from "../base/types";
import { SALES_AGENT_PERSONA } from "../shared/personaPresets";
import { SALES_TOOLS } from "../shared/tools";

/**
 * ============================================================
 * SALES AGENT
 * ============================================================
 * Specialized agent for sales inquiries, lead qualification,
 * and guiding prospects through the sales funnel
 */

export class SalesAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "sales",
      name: SALES_AGENT_PERSONA.name,
      description: SALES_AGENT_PERSONA.description,
      systemPrompt: SALES_AGENT_PERSONA.systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
      tools: SALES_TOOLS,
      ragEnabled: true,
      safetyLevel: "moderate",
    };

    super(config);
  }

  /**
   * Generate mock response for sales inquiries
   */
  protected generateMockResponse(
    request: AgentRequest,
    history: Message[]
  ): AgentResponse {
    void history;
    const message = request.message.toLowerCase();

    // Detect intent and generate appropriate response
    let answer = "";
    let confidence = 0.85;
    const sources: string[] = [];

    // Pricing inquiry
    if (
      message.includes("pricing") ||
      message.includes("cost") ||
      message.includes("price")
    ) {
      answer = `Great question about pricing! Synqra offers flexible plans to match your team's needs:

**Starter Plan** - $29/month
- Perfect for small teams (up to 5 users)
- Core automation features
- Email support
- 1GB storage

**Professional Plan** - $99/month (Most Popular)
- Ideal for growing teams (up to 25 users)
- Advanced integrations and workflows
- Priority support
- 10GB storage
- Custom automations

**Enterprise Plan** - Custom Pricing
- Unlimited users and storage
- Dedicated success manager
- 24/7 premium support
- Custom development
- SLA guarantee

To give you a more tailored recommendation, could you tell me:
1. How many team members would be using Synqra?
2. What specific workflows are you looking to automate?
3. Are there any specific integrations you need (Salesforce, Slack, etc.)?

Would you like to schedule a quick demo to see how Synqra can transform your workflow?`;

      sources.push("/pricing", "/docs/plans-comparison");
      confidence = 0.95;
    }
    // Demo request
    else if (
      message.includes("demo") ||
      message.includes("show me") ||
      message.includes("see it")
    ) {
      answer = `I'd love to show you Synqra in action! Our product demos are customized to your specific use case and typically take about 30 minutes.

During the demo, we'll:
✓ Walk through your current workflow challenges
✓ Show you exactly how Synqra solves those problems
✓ Demonstrate our key features with real examples
✓ Answer any technical or business questions
✓ Discuss next steps (trial, implementation, pricing)

**What to expect:**
- Screen-shared walkthrough of the platform
- Live Q&A with our product expert
- Custom use case examples
- No pressure - just helpful information

Could you share:
1. Your availability this week or next?
2. Which features you're most interested in seeing?
3. Any specific workflows you'd like us to demonstrate?

I'll get you connected with our demo team right away!`;

      sources.push("/sales/demo-request", "/docs/getting-started");
      confidence = 0.9;
    }
    // Feature inquiry
    else if (
      message.includes("feature") ||
      message.includes("can it") ||
      message.includes("does it") ||
      message.includes("how does")
    ) {
      answer = `Synqra is a comprehensive business automation platform with powerful features designed to streamline your workflow:

**Core Features:**
🚀 **Intelligent Automation** - Automate repetitive tasks and workflows
📊 **Analytics Dashboard** - Real-time insights and performance metrics
🔗 **200+ Integrations** - Connect with tools you already use
🤖 **AI-Powered Insights** - Smart recommendations and predictions
👥 **Team Collaboration** - Share, comment, and work together seamlessly
📱 **Mobile Apps** - iOS and Android for on-the-go access

**Popular Use Cases:**
- Sales pipeline automation
- Customer support ticketing
- Marketing campaign management
- Data synchronization across tools
- Report generation and distribution

What specific capability are you interested in? I can dive deeper into any area or show you how it applies to your specific workflow.

Also, what problem are you trying to solve with automation? That'll help me highlight the most relevant features for your needs.`;

      sources.push("/features", "/docs/capabilities", "/use-cases");
      confidence = 0.85;
    }
    // Integration inquiry
    else if (
      message.includes("integrat") ||
      message.includes("connect") ||
      message.includes("work with")
    ) {
      answer = `Excellent question! Integration capabilities are one of Synqra's strongest features.

**Popular Integrations:**
- **CRM**: Salesforce, HubSpot, Pipedrive, Zoho
- **Communication**: Slack, Microsoft Teams, Discord
- **Productivity**: Google Workspace, Microsoft 365, Notion
- **Development**: GitHub, GitLab, Jira, Linear
- **E-commerce**: Shopify, WooCommerce, Stripe
- **Marketing**: Mailchimp, SendGrid, HubSpot

**Integration Features:**
✓ Two-way sync - data flows both directions
✓ Real-time updates - changes sync instantly
✓ Custom field mapping - match your data structure
✓ Automated workflows - trigger actions across platforms
✓ API access - build custom integrations

**Plus, we have:**
- Webhooks for real-time event triggers
- REST API for custom development
- Zapier/Make.com support for 1000s more apps

Which tools are you currently using? I can confirm specific integration capabilities and show you example workflows.`;

      sources.push("/integrations", "/docs/api", "/docs/webhooks");
      confidence = 0.9;
    }
    // Trial inquiry
    else if (
      message.includes("trial") ||
      message.includes("try") ||
      message.includes("test")
    ) {
      answer = `Absolutely! We offer a **14-day free trial** of our Professional plan - no credit card required.

**What's included in the trial:**
✓ Full access to all Professional features
✓ Up to 25 user seats
✓ All integrations available
✓ Onboarding support from our team
✓ No credit card needed upfront
✓ Cancel anytime - no commitment

**Getting started is easy:**
1. Sign up at synqra.co/trial (takes 2 minutes)
2. Connect your first integration
3. Set up your first automation
4. Our team sends you helpful guides and tips

**Plus, trial users get:**
- Personalized onboarding call (optional)
- Access to our Slack community
- Template library to jumpstart your workflows
- Dedicated support during your trial period

After 14 days, you can:
- Upgrade to a paid plan (with special trial-to-paid discount)
- Downgrade to our free Starter tier
- Cancel with no charges

Would you like me to send you the trial signup link, or do you have any questions before getting started?`;

      sources.push("/trial", "/pricing", "/docs/getting-started");
      confidence = 0.95;
    }
    // Comparison with competitors
    else if (
      message.includes("vs") ||
      message.includes("compared to") ||
      message.includes("better than") ||
      message.includes("zapier") ||
      message.includes("make.com")
    ) {
      answer = `Great question! It's important to choose the right tool for your needs. Here's how Synqra compares:

**Synqra vs. Zapier/Make.com:**

**Where Synqra excels:**
✓ Built-in AI capabilities for smarter automation
✓ Native analytics and reporting dashboards
✓ Team collaboration features
✓ More affordable for larger teams
✓ Deeper integrations (not just triggers/actions)
✓ Better for complex, multi-step workflows
✓ Built-in customer support features

**Where others are strong:**
- Zapier has more total integrations (but many are basic)
- Make.com has a visual workflow builder (we do too!)

**Best for:**
- **Synqra**: Teams that need powerful automation + analytics + collaboration
- **Zapier**: Simple point-to-point connections
- **Make.com**: Visual learners who want basic automations

**The honest truth:** Many of our customers use Synqra alongside Zapier for different use cases. Synqra handles your core business workflows, while Zapier might handle one-off personal automations.

What specific features or workflows are most important to you? That'll help me give you a more personalized comparison.`;

      sources.push("/comparison", "/features", "/pricing");
      confidence = 0.8;
    }
    // General inquiry - use fallback
    else {
      const fallbackIndex = Math.floor(
        Math.random() * SALES_AGENT_PERSONA.fallbackResponses.length
      );
      const fallback = SALES_AGENT_PERSONA.fallbackResponses[fallbackIndex];

      answer = `${fallback}

To help you better, here's what Synqra can do for your business:

Synqra is an intelligent business automation platform that helps teams eliminate repetitive work, connect their tools, and scale their operations without hiring more people.

**Popular use cases:**
- Automate sales follow-ups and lead nurturing
- Sync data between CRM, marketing, and support tools
- Generate automated reports and dashboards
- Streamline customer onboarding and offboarding
- Manage support tickets and customer communications

**What makes us different:**
✓ AI-powered automation that learns from your patterns
✓ Beautiful analytics that actually help you make decisions
✓ Built for teams (not just individual users)
✓ Affordable pricing that scales with you

What specific challenge brought you to Synqra today? I'd love to understand your workflow and show you exactly how we can help.`;

      sources.push("/features", "/use-cases", "/docs/overview");
      confidence = 0.7;
    }

    return {
      answer,
      confidence,
      sources,
      reasoning: "Mock sales response based on keyword detection",
      metadata: {
        mode: "mock",
        agentRole: "sales",
        timestamp: Date.now(),
      },
    };
  }
}

// Export singleton instance
export const salesAgent = new SalesAgent();
