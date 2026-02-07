import { BaseAgent } from "../base/agent";
import { AgentConfig, AgentRequest, AgentResponse, Message } from "../base/types";
import { SERVICE_AGENT_PERSONA } from "../shared/personaPresets";
import { SERVICE_TOOLS } from "../shared/tools";

/**
 * ============================================================
 * SERVICE AGENT
 * ============================================================
 * Specialized agent for customer service, account management,
 * billing, and general customer success
 */

export class ServiceAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "service",
      name: SERVICE_AGENT_PERSONA.name,
      description: SERVICE_AGENT_PERSONA.description,
      systemPrompt: SERVICE_AGENT_PERSONA.systemPrompt,
      temperature: 0.6,
      maxTokens: 4096,
      tools: SERVICE_TOOLS,
      ragEnabled: true,
      safetyLevel: "moderate",
    };

    super(config);
  }

  /**
   * Generate mock response for service inquiries
   */
  protected generateMockResponse(
    request: AgentRequest,
    history: Message[]
  ): AgentResponse {
    void history;
    const message = request.message.toLowerCase();

    let answer = "";
    let confidence = 0.85;
    const sources: string[] = [];

    // Billing inquiries
    if (
      message.includes("billing") ||
      message.includes("invoice") ||
      message.includes("payment") ||
      message.includes("charge")
    ) {
      answer = `I'd be happy to help with your billing inquiry!

**Billing & Payment Information:**

**Viewing Your Bills:**
1. Go to Settings > Billing
2. See current subscription, payment method, and invoice history
3. Download invoices as PDF for accounting

**Payment Methods:**
We accept:
• Credit cards (Visa, Mastercard, Amex, Discover)
• Debit cards
• ACH/Bank transfer (Enterprise plans)
• Purchase orders (Enterprise plans, NET 30 terms)

**Billing Cycles:**
• Monthly: Billed on the same day each month
• Annual: Billed once per year (save 20%!)
• Enterprise: Custom billing terms available

**Common Billing Questions:**

**"Why was I charged?"**
• Charges occur on your renewal date
• Pro-rated charges if you add users mid-cycle
• One-time charges for add-ons or overages

**"How do I update my payment method?"**
1. Settings > Billing > Payment Method
2. Click "Update Payment Method"
3. Enter new card details
4. Save changes

**"Can I get a refund?"**
• 30-day money-back guarantee (no questions asked)
• Pro-rated refunds for annual plans (case-by-case)
• No refunds for partial months on monthly plans

**"What if my payment failed?"**
• We'll retry in 3 days
• Update your payment method before retry
• Account may be paused if payment fails twice

**Need help with:**
1. Reviewing specific charges?
2. Updating payment method?
3. Switching to annual billing (20% savings)?
4. Getting invoices for accounting?
5. Discussing payment plans?

Let me know what specific billing question you have!`;

      sources.push(
        "/billing",
        "/docs/billing-faq",
        "/pricing"
      );
      confidence = 0.9;
    }
    // Account / Subscription management
    else if (
      message.includes("upgrade") ||
      message.includes("downgrade") ||
      message.includes("change plan") ||
      message.includes("subscription")
    ) {
      answer = `I can definitely help you with plan changes!

**Changing Your Plan:**

**Upgrading Your Plan** 🎉
Great decision! Here's how:
1. Go to Settings > Billing > Plan
2. Click "Upgrade Plan"
3. Choose your new tier (Professional or Enterprise)
4. Confirm the change

**What happens when you upgrade:**
• Change is immediate - new features available right away
• Pro-rated charge for remainder of billing cycle
• Next bill will be at the new rate
• No downtime or data migration needed

**Downgrading Your Plan**
We're sorry to see you scale back, but we understand:
1. Go to Settings > Billing > Plan
2. Click "Change Plan"
3. Select lower tier
4. Confirm (takes effect at end of current billing period)

**What happens when you downgrade:**
• Keeps current features until end of billing cycle
• No refund for unused portion of current plan
• May need to remove users if exceeding new limit
• Some features will become read-only

**Current Plans:**

**Starter - $29/month**
• 5 users
• Basic integrations
• Email support
• 1GB storage

**Professional - $99/month** ⭐ Most Popular
• 25 users
• All integrations
• Priority support
• 10GB storage
• Custom workflows

**Enterprise - Custom**
• Unlimited users
• Dedicated support
• Custom features
• SLA guarantee

**💡 Questions to consider:**
1. What's driving the plan change?
2. What features do you need?
3. How many team members need access?
4. Is budget a concern? (we may have options)

**Special Offers:**
• Annual billing: Save 20%
• Non-profit discount: 30% off
• Startup discount: 50% off for 1 year (if eligible)

Which plan are you considering, and how can I help make the transition smooth?`;

      sources.push(
        "/pricing",
        "/docs/plan-changes",
        "/billing"
      );
      confidence = 0.95;
    }
    // Cancellation
    else if (
      message.includes("cancel") ||
      message.includes("close account") ||
      message.includes("delete account")
    ) {
      answer = `I understand you're considering canceling your Synqra account. Before we proceed, I'd love to understand your situation better - there might be a solution that works better for you.

**May I ask:**
1. What's prompting you to cancel?
2. Is there a specific feature or issue that's not meeting your needs?
3. Is this about pricing, features, or something else?

**Before you cancel, consider:**

**Option 1: Downgrade to Free Tier**
• Keep your account and data
• Access to basic features
• No billing charges
• Upgrade anytime you're ready

**Option 2: Pause Your Account (1-3 months)**
• Temporarily pause billing
• Keep all your data and settings
• Resume whenever you're ready

**Option 3: Get Help**
• Free consultation with our success team
• Troubleshoot any issues you're facing
• Optimize your setup for better results

**Option 4: Custom Plan**
• For budget concerns, we can explore options
• Nonprofit/startup discounts available
• Custom feature sets for Enterprise

**If you still want to proceed with cancellation:**

**Immediate Cancellation:**
1. Settings > Billing > Cancel Subscription
2. Confirm cancellation
3. Access until end of current billing period
4. Export your data before access ends

**What happens after cancellation:**
• No more charges (end of current period)
• Account becomes read-only
• Data retained for 30 days (export it!)
• Can reactivate anytime within 90 days

**Data Export:**
• Settings > Data > Export All Data
• Includes all automations, integrations, reports
• Downloadable as JSON/CSV

**We'd really value your feedback:**
• Help us improve by sharing why you're leaving
• Quick 2-minute exit survey (optional)
• Your input shapes our product roadmap

**30-Day Money-Back Guarantee:**
If you're within your first 30 days, you qualify for a full refund.

What's the main reason you're considering canceling? I genuinely want to help find the best solution for you.`;

      sources.push(
        "/docs/cancellation",
        "/billing",
        "/data-export"
      );
      confidence = 0.85;
    }
    // Feature request
    else if (
      message.includes("feature request") ||
      message.includes("can you add") ||
      message.includes("i wish") ||
      message.includes("would be great if")
    ) {
      answer = `Thank you for the feature suggestion! Customer feedback directly shapes our product roadmap.

**How We Handle Feature Requests:**

**Submitting Your Request:**
I'll document your request with our product team. To help them prioritize and implement it effectively, could you share:

1. **What feature/improvement do you want?**
   (Be as specific as possible)

2. **What problem would this solve?**
   (Help us understand the use case)

3. **How would you use it?**
   (Workflow example is super helpful)

4. **How often would you use this?**
   (Daily, weekly, occasionally?)

5. **Any alternatives you're using now?**
   (Workarounds or competitor features)

**What Happens Next:**

✓ **Logged in our system** - Your request gets a tracking number
✓ **Reviewed by product team** - Usually within 1 week
✓ **Prioritized** - Based on demand, impact, and feasibility
✓ **You get updates** - Email notification when status changes

**Feature Request Status:**
• **Under Review** - Product team evaluating
• **Planned** - Scheduled for development
• **In Development** - Being built now
• **Shipped** - Feature is live!

**Timeline Expectations:**
• Quick wins: 2-4 weeks
• Medium features: 1-3 months
• Major features: 3-6 months
• Enterprise custom: Varies (faster for Enterprise customers)

**Already Built?**
Sometimes features exist but aren't obvious! Before I submit this, let me check:
• Search our docs: docs.synqra.com
• Check recent product updates
• See if there's a workaround

**Increase Priority:**
• Get teammates to upvote (send them the request link)
• Enterprise customers get dedicated dev resources
• Popular requests get fast-tracked

**Our Recent Feature Launches:**
✓ Advanced API rate limiting
✓ Custom workflow templates
✓ Slack notifications
✓ Bulk data export

What specific feature are you hoping to see? I'll make sure it gets the attention it deserves!`;

      sources.push(
        "/feature-requests",
        "/product-roadmap",
        "/docs/whats-new"
      );
      confidence = 0.85;
    }
    // User management / Team
    else if (
      message.includes("add user") ||
      message.includes("remove user") ||
      message.includes("team") ||
      message.includes("invite") ||
      message.includes("permission")
    ) {
      answer = `I can help you manage your team members and permissions!

**Managing Users:**

**Adding Team Members:**
1. Settings > Team > Invite Member
2. Enter email address(es)
3. Assign role (Admin, Member, or Viewer)
4. Send invitation
5. They'll receive an email to join

**User Roles & Permissions:**

**Admin**
• Full access to everything
• Can invite/remove users
• Billing and plan management
• Delete automations and data

**Member**
• Create and edit automations
• View all data and reports
• Cannot manage billing or users
• Cannot delete account

**Viewer (Read-Only)**
• View dashboards and reports
• Cannot create or edit anything
• Perfect for stakeholders/clients
• No billing access

**Removing Team Members:**
1. Settings > Team
2. Find the user
3. Click "..." menu
4. Select "Remove User"
5. Confirm removal

**What happens when you remove a user:**
• Their access is revoked immediately
• Automations they created remain
• No refund for unused seat
• Can be re-invited anytime

**User Limits by Plan:**
• Starter: 5 users
• Professional: 25 users
• Enterprise: Unlimited

**Additional Users:**
If you need more seats:
• Starter: $5/month per additional user
• Professional: $15/month per additional user
• Enterprise: Included in custom pricing

**Transferring Ownership:**
To transfer account ownership:
1. Settings > Team > Transfer Ownership
2. Select new owner (must be an Admin)
3. Confirm transfer
4. New owner must accept

**Managing Permissions:**
• Can't customize roles (yet - it's on our roadmap!)
• Workaround: Create multiple workspaces
• Enterprise: Custom role creation available

**Need help with:**
1. Adding specific team members?
2. Setting up the right permissions structure?
3. Upgrading for more user seats?
4. Removing inactive users?

What's your specific team management need?`;

      sources.push(
        "/docs/team-management",
        "/docs/permissions",
        "/pricing"
      );
      confidence = 0.9;
    }
    // Fallback
    else {
      const fallbackIndex = Math.floor(
        Math.random() * SERVICE_AGENT_PERSONA.fallbackResponses.length
      );
      const fallback = SERVICE_AGENT_PERSONA.fallbackResponses[fallbackIndex];

      answer = `${fallback}

**I can help you with:**

**💳 Billing & Payments**
• View invoices and payment history
• Update payment methods
• Understand charges
• Request refunds

**📊 Account Management**
• Upgrade or downgrade plans
• Add/remove team members
• Manage permissions
• Transfer account ownership

**💡 Feature Requests & Feedback**
• Submit product suggestions
• Track feature request status
• Share feedback on current features

**🔄 Account Changes**
• Cancel subscription
• Export your data
• Pause your account
• Reactivate account

**📚 General Questions**
• How-to guidance
• Best practices
• Training resources
• Product information

**Current Account Summary:**
(Mock data - would show real info for authenticated users)
• Plan: Professional
• Users: 12 / 25
• Billing: $99/month
• Next renewal: Dec 9, 2025

How can I help you today?`;

      sources.push("/support", "/docs/account-management");
      confidence = 0.7;
    }

    return {
      answer,
      confidence,
      sources,
      reasoning: "Mock service response based on category detection",
      metadata: {
        mode: "mock",
        agentRole: "service",
        timestamp: Date.now(),
      },
    };
  }
}

// Export singleton instance
export const serviceAgent = new ServiceAgent();
