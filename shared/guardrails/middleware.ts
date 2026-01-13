/**
 * ════════════════════════════════════════════════════════════════
 * NØID GUARDRAIL MIDDLEWARE
 * ════════════════════════════════════════════════════════════════
 * 
 * Automatic guardrail enforcement for API routes
 */

import {
  createGuardrailSystem,
  type ProjectName,
} from "./noid-guardrail-system";

/**
 * Middleware wrapper for API routes with automatic guardrail enforcement
 */
export function withGuardrails<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  config: {
    project: ProjectName;
    operation: string;
    estimateCost?: (req: any) => number;
    extractContent?: (req: any) => string | undefined;
    extractUserId?: (req: any) => string | undefined;
    extractMetadata?: (req: any) => Record<string, any> | undefined;
    onViolation?: (violations: any[]) => void;
  }
): T {
  return (async (...args: any[]) => {
    const request = args[0]; // First arg is typically the request

    try {
      // Create guardrail system
      const guardrails = createGuardrailSystem(config.project);

      // Extract context from request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedCost = config.estimateCost?.(request);
      const content = config.extractContent?.(request);
      const userId = config.extractUserId?.(request);
      const metadata = config.extractMetadata?.(request);

      // Run guardrail checks
      const checkResult = await guardrails.runAllChecks({
        userId,
        requestId,
        operation: config.operation,
        estimatedCost,
        content,
        metadata,
      });

      // If not allowed, return error response
      if (!checkResult.allowed) {
        const response = {
          ok: false,
          error: "Guardrail violation",
          message: "Request blocked by guardrails",
          requestId,
          violations: checkResult.violations.map((v) => ({
            category: v.category,
            level: v.level,
            description: v.description,
          })),
          recommendations: checkResult.results
            .filter((r) => !r.passed)
            .flatMap((r) => r.recommendations),
          timestamp: new Date().toISOString(),
        };

        // Call violation handler if provided
        config.onViolation?.(checkResult.violations);

        // Return error response (format depends on framework)
        if (typeof args[1]?.json === "function") {
          // Next.js App Router
          return new Response(JSON.stringify(response), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          // Other frameworks
          return response;
        }
      }

      // Guardrails passed - proceed with original handler
      return await handler(...args);
    } catch (error) {
      console.error("[Guardrail Middleware Error]:", error);

      // On error, allow request to proceed (fail open for availability)
      // In production, you might want to fail closed for security
      console.warn("⚠️ Guardrail check failed, proceeding anyway");
      return await handler(...args);
    }
  }) as T;
}

/**
 * Decorator-style guardrail enforcement for class methods
 */
export function Guarded(config: {
  project: ProjectName;
  operation: string;
  estimateCost?: number;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const guardrails = createGuardrailSystem(config.project);

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const checkResult = await guardrails.runAllChecks({
        requestId,
        operation: config.operation,
        estimatedCost: config.estimateCost,
      });

      if (!checkResult.allowed) {
        throw new Error(
          `Guardrail violation: ${checkResult.violations.map((v) => v.description).join("; ")}`
        );
      }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Express.js middleware (for compatibility)
 */
export function guardrailMiddleware(config: {
  project: ProjectName;
  operation: string;
}) {
  return async (req: any, res: any, next: any) => {
    try {
      const guardrails = createGuardrailSystem(config.project);

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const checkResult = await guardrails.runAllChecks({
        requestId,
        operation: config.operation,
        userId: req.user?.id || req.headers["x-user-id"],
        metadata: {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          path: req.path,
        },
      });

      if (!checkResult.allowed) {
        return res.status(403).json({
          ok: false,
          error: "Guardrail violation",
          violations: checkResult.violations,
          timestamp: new Date().toISOString(),
        });
      }

      // Attach check result to request for logging
      req.guardrailCheck = checkResult;

      next();
    } catch (error) {
      console.error("[Guardrail Middleware Error]:", error);
      // Fail open
      next();
    }
  };
}

/**
 * Quick guardrail check for inline usage
 */
export async function checkGuardrails(config: {
  project: ProjectName;
  operation: string;
  estimatedCost?: number;
  content?: string;
  userId?: string;
}): Promise<{
  allowed: boolean;
  violations: string[];
  level: string;
}> {
  const guardrails = createGuardrailSystem(config.project);

  const result = await guardrails.runAllChecks({
    requestId: `check_${Date.now()}`,
    operation: config.operation,
    estimatedCost: config.estimatedCost,
    content: config.content,
    userId: config.userId,
  });

  return {
    allowed: result.allowed,
    violations: result.violations.map((v) => v.description),
    level: result.overallLevel,
  };
}

/**
 * Example usage in API route:
 * 
 * export const POST = withGuardrails(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ ok: true });
 *   },
 *   {
 *     project: "synqra",
 *     operation: "generate_content",
 *     estimateCost: (req) => 0.05,
 *     extractContent: async (req) => {
 *       const body = await req.json();
 *       return body.prompt;
 *     },
 *   }
 * );
 */
