import { BaseAgent } from "../base/agent";
import { AgentConfig, AgentRequest, AgentResponse, Message } from "../base/types";
import { SUPPORT_AGENT_PERSONA } from "../shared/personaPresets";
import { SUPPORT_TOOLS } from "../shared/tools";

/**
 * ============================================================
 * SUPPORT AGENT
 * ============================================================
 * Specialized agent for technical support, troubleshooting,
 * and issue resolution
 */

export class SupportAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "support",
      name: SUPPORT_AGENT_PERSONA.name,
      description: SUPPORT_AGENT_PERSONA.description,
      systemPrompt: SUPPORT_AGENT_PERSONA.systemPrompt,
      temperature: 0.5, // Lower temperature for more consistent troubleshooting
      maxTokens: 4096,
      tools: SUPPORT_TOOLS,
      ragEnabled: true,
      safetyLevel: "strict",
    };

    super(config);
  }

  /**
   * Generate mock response for support inquiries
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

    // Login issues
    if (
      message.includes("login") ||
      message.includes("log in") ||
      message.includes("sign in") ||
      message.includes("can't access")
    ) {
      answer = `I'm sorry you're having trouble accessing your account. Let's get you back in right away.

**Common login issues and solutions:**

**1. Password Issues**
If you've forgotten your password:
• Click "Forgot Password" on the login page
• Enter your email address
• Check your inbox for the reset link (check spam folder too)
• Create a new password (min. 8 characters, include numbers and symbols)

**2. Account Locked**
After 5 failed login attempts, accounts are temporarily locked for security:
• Wait 15 minutes and try again
• Or use the "Forgot Password" link to reset immediately

**3. SSO / Single Sign-On Issues**
If you're logging in through your company's SSO:
• Make sure you're using your work email (not personal)
• Contact your IT admin if SSO isn't working
• Try the direct login as a backup

**4. Browser/Cache Issues**
• Clear your browser cache and cookies
• Try incognito/private browsing mode
• Update your browser to the latest version

**Can you tell me:**
1. What error message are you seeing (if any)?
2. Are you using email/password or SSO?
3. Have you successfully logged in before, or is this your first time?

I'm here to help get this resolved quickly!`;

      sources.push("/docs/login-troubleshooting", "/support/authentication");
      confidence = 0.9;
    }
    // API / Integration errors
    else if (
      message.includes("api") ||
      message.includes("integration") ||
      message.includes("webhook") ||
      message.includes("error 4") ||
      message.includes("error 5")
    ) {
      answer = `I understand how frustrating API issues can be, especially when they impact your workflow. Let's diagnose this together.

**Common API/Integration Issues:**

**1. Authentication Errors (401/403)**
✓ Verify your API key is correct and hasn't expired
✓ Check that the API key has the right permissions
✓ Regenerate your API key in Settings > API

**2. Rate Limiting (429)**
✓ You may have exceeded API rate limits
✓ Standard plan: 1000 requests/hour
✓ Professional: 5000 requests/hour
✓ Enterprise: Custom limits
✓ Implement exponential backoff in your code

**3. Webhook Not Firing**
✓ Verify the webhook URL is accessible from the internet
✓ Check that your endpoint returns a 200 status code
✓ Review webhook logs in Dashboard > Integrations > Webhooks
✓ Test with a webhook testing tool (webhook.site)

**4. Integration Connection Lost**
✓ Reconnect the integration in Settings > Integrations
✓ Check if the third-party service is experiencing issues
✓ Verify OAuth tokens haven't expired

**Diagnostic Steps:**
1. What error code/message are you seeing?
2. Which API endpoint or integration is failing?
3. When did this start happening?
4. Has this integration worked before?

**Quick Actions:**
• Check our Status Page: status.synqra.com
• View API logs: Dashboard > Logs
• Test API: developers.synqra.com/api-tester

Please provide the specific error details, and I'll help you resolve this quickly!`;

      sources.push(
        "/docs/api-troubleshooting",
        "/docs/integrations",
        "/docs/webhooks",
        "/support/api-errors"
      );
      confidence = 0.85;
    }
    // Performance / Slow loading
    else if (
      message.includes("slow") ||
      message.includes("loading") ||
      message.includes("performance") ||
      message.includes("timeout")
    ) {
      answer = `I'm sorry you're experiencing performance issues. Slow loading can definitely impact productivity. Let's identify and fix the problem.

**Common Performance Issues:**

**1. Dashboard Loading Slowly**
Immediate fixes:
• Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
• Clear browser cache
• Disable browser extensions temporarily
• Try a different browser

**2. Large Data Sets**
If you're working with large amounts of data:
• Use filters to reduce the data displayed
• Increase pagination limits
• Consider exporting data for offline analysis
• Use our API for bulk operations

**3. Network/Connection Issues**
• Test your internet speed: fast.com
• Check if you're on VPN (can slow things down)
• Try switching networks (WiFi vs. mobile)
• Disable proxy if not required

**4. Time-Based Issues**
If slow at specific times:
• May be during peak usage hours
• Check status.synqra.com for any incidents
• Contact us for dedicated infrastructure (Enterprise)

**Diagnostic Questions:**
1. Which specific page or feature is slow?
2. How slow? (seconds to load?)
3. Does it happen all the time or at specific times?
4. What browser and version are you using?
5. Are you on desktop or mobile?

**System Status:**
✓ API: Operational (99.99% uptime)
✓ Dashboard: Operational
✓ Integrations: Operational

If this is urgent and affecting your business, I can escalate this to our engineering team immediately. Just let me know!`;

      sources.push(
        "/docs/performance",
        "/support/troubleshooting",
        "/system-status"
      );
      confidence = 0.85;
    }
    // Data issues
    else if (
      message.includes("data") ||
      message.includes("missing") ||
      message.includes("not showing") ||
      message.includes("disappeared")
    ) {
      answer = `I understand your concern about missing or incorrect data. Data integrity is our top priority. Let's investigate this immediately.

**Common Data Issues:**

**1. Data Not Appearing**
First, let's check:
• Refresh the page (Ctrl+R or Cmd+R)
• Check filter settings - are filters hiding the data?
• Verify date range selector (last 7 days, 30 days, etc.)
• Confirm you're viewing the correct workspace/project

**2. Sync Delays**
If data from integrations is delayed:
• Normal sync time: 5-15 minutes
• Force sync: Dashboard > Integrations > [Integration] > Sync Now
• Check integration status for any errors

**3. Missing Historical Data**
• Check your data retention settings
• Free plans: 30 days retention
• Paid plans: Unlimited retention
• Deleted data may be recoverable within 30 days

**4. Incorrect Data/Calculations**
• Verify source data is correct
• Check formula configuration
• Review any recent changes to automations
• Compare with source system

**⚠️ IMPORTANT - Data Recovery:**
If data was accidentally deleted:
• We maintain backups for 30 days
• Contact support@synqra.com immediately
• Include: what was deleted, when, by whom (if known)

**Immediate Actions:**
1. Don't delete anything else
2. Document what's missing/incorrect
3. Note when you first noticed the issue

**Can you help me understand:**
1. What specific data is missing or incorrect?
2. When did you last see the correct data?
3. Have you made any recent changes to integrations or settings?

This could be a simple fix, but I want to handle it carefully to ensure your data is safe!`;

      sources.push(
        "/docs/data-management",
        "/support/data-recovery",
        "/docs/sync"
      );
      confidence = 0.8;
    }
    // General error
    else if (
      message.includes("error") ||
      message.includes("issue") ||
      message.includes("problem") ||
      message.includes("not working") ||
      message.includes("broken")
    ) {
      answer = `I'm here to help resolve this issue. Technical problems are frustrating, and I want to get you back up and running as quickly as possible.

**To help me diagnose the problem effectively, could you provide:**

**1. Error Details**
• Exact error message (if any)
• Error code or number
• Screenshot or screen recording if possible

**2. Context**
• What were you trying to do when this happened?
• Which page or feature were you using?
• Has this feature worked for you before?

**3. Environment**
• Browser (Chrome, Firefox, Safari, etc.) and version
• Device (desktop, mobile, tablet)
• Operating system

**4. Timing**
• When did this start?
• Does it happen every time or intermittently?

**While you gather that info, here are some quick troubleshooting steps:**

✓ Refresh the page (Ctrl+R or Cmd+R)
✓ Clear browser cache and cookies
✓ Try incognito/private browsing mode
✓ Check our status page: status.synqra.com
✓ Disable browser extensions temporarily

**If this is critical and blocking your work:**
• I can escalate to our senior support team
• We offer screen-sharing support sessions
• Enterprise customers: call our 24/7 hotline

I'm committed to getting this resolved. Please share those details, and we'll tackle this together!`;

      sources.push(
        "/support/troubleshooting",
        "/docs/common-issues",
        "/system-status"
      );
      confidence = 0.75;
    }
    // How-to / Feature usage
    else if (
      message.includes("how to") ||
      message.includes("how do i") ||
      message.includes("how can i")
    ) {
      answer = `I'd be happy to help you with that!

To give you the most accurate instructions, could you tell me a bit more about what you're trying to accomplish?

**In the meantime, here are our most popular help resources:**

**📖 Documentation**
• Getting Started Guide: docs.synqra.com/getting-started
• Video Tutorials: synqra.com/tutorials
• FAQs: help.synqra.com

**🎓 Popular How-To Guides:**
• Setting up your first automation
• Connecting integrations
• Creating custom workflows
• Managing team members and permissions
• Building reports and dashboards
• Exporting data

**💡 Pro Tips:**
• Use our in-app search (Cmd+K or Ctrl+K)
• Check the "?" icon on any page for contextual help
• Browse our template library for pre-built solutions

**Live Help Options:**
• Chat with us (bottom right of dashboard)
• Schedule a support call
• Join our community Slack
• Watch our weekly "Office Hours" webinars

What specific task are you trying to complete? I can walk you through it step-by-step!`;

      sources.push(
        "/docs/getting-started",
        "/support/how-to",
        "/tutorials"
      );
      confidence = 0.7;
    }
    // Fallback
    else {
      const fallbackIndex = Math.floor(
        Math.random() * SUPPORT_AGENT_PERSONA.fallbackResponses.length
      );
      const fallback = SUPPORT_AGENT_PERSONA.fallbackResponses[fallbackIndex];

      answer = `${fallback}

**Here's how I can help:**

**🔧 Technical Issues**
• Login and access problems
• API and integration errors
• Performance and loading issues
• Data sync and accuracy issues

**📚 How-To Support**
• Step-by-step feature guidance
• Best practices and workflows
• Configuration help
• Training and onboarding

**🚨 Urgent Issues**
• System downtime
• Data loss or corruption
• Security concerns
• Critical business impact

**Current System Status:**
✓ All systems operational
✓ 99.99% uptime this month
✓ No known incidents

Could you describe the issue you're experiencing in more detail? Include any error messages, what you were trying to do, and when the problem started. This will help me provide the most accurate solution!`;

      sources.push("/support", "/docs/overview");
      confidence = 0.6;
    }

    return {
      answer,
      confidence,
      sources,
      reasoning: "Mock support response based on issue categorization",
      metadata: {
        mode: "mock",
        agentRole: "support",
        timestamp: Date.now(),
        ticketCreated: false, // Would be true if we created a support ticket
      },
    };
  }
}

// Export singleton instance
export const supportAgent = new SupportAgent();
