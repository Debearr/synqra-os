/**
 * ============================================================
 * RAILWAY SERVICE CONFIGURATION
 * ============================================================
 * Central source of truth for Railway service settings
 * Ports, domains, Docker images, resource limits
 * 
 * RPRD DNA: Simple, clear, no conflicts
 */

export type RailwayService = {
  name: string;
  displayName: string;
  port: number;
  healthCheckPath: string;
  
  // Docker
  dockerImage?: string; // If using custom image
  dockerfile?: string; // Path to Dockerfile
  
  // Resources
  memory: {
    min: number; // MB
    recommended: number; // MB
    max: number; // MB
  };
  cpu: {
    min: number; // millicores
    recommended: number; // millicores
  };
  
  // Domains
  customDomain?: string;
  railwayDomain?: string;
  
  // Environment
  envVars: string[]; // Required env var keys
};

/**
 * All Railway services in our monorepo
 */
export const RAILWAY_SERVICES: Record<string, RailwayService> = {
  "synqra-mvp": {
    name: "synqra-mvp",
    displayName: "Synqra MVP",
    port: 3000,
    healthCheckPath: "/api/health",
    
    dockerfile: "apps/synqra-mvp/Dockerfile",
    
    memory: {
      min: 512,
      recommended: 1024,
      max: 2048,
    },
    cpu: {
      min: 500,
      recommended: 1000,
    },
    
    customDomain: "synqra.app",
    
    envVars: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "ANTHROPIC_API_KEY",
    ],
  },

  "noid-dashboard": {
    name: "noid-dashboard",
    displayName: "NØID Dashboard",
    port: 3001,
    healthCheckPath: "/api/health",
    
    dockerfile: "noid-dashboard/Dockerfile",
    
    memory: {
      min: 512,
      recommended: 1024,
      max: 2048,
    },
    cpu: {
      min: 500,
      recommended: 1000,
    },
    
    customDomain: "noid.app",
    
    envVars: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },

  "noid-digital-cards": {
    name: "noid-digital-cards",
    displayName: "NØID Digital Cards",
    port: 3002,
    healthCheckPath: "/api/health",
    
    dockerfile: "noid-digital-cards/Dockerfile",
    
    memory: {
      min: 256,
      recommended: 512,
      max: 1024,
    },
    cpu: {
      min: 250,
      recommended: 500,
    },
    
    envVars: ["NEXT_PUBLIC_APP_URL"],
  },
};

/**
 * Get service config by name
 */
export function getServiceConfig(serviceName: string): RailwayService | undefined {
  return RAILWAY_SERVICES[serviceName];
}

/**
 * Get all service names
 */
export function getAllServiceNames(): string[] {
  return Object.keys(RAILWAY_SERVICES);
}

/**
 * Validate that a service's environment variables are set
 */
export function validateServiceEnv(serviceName: string): {
  valid: boolean;
  missing: string[];
} {
  const config = getServiceConfig(serviceName);
  if (!config) {
    return { valid: false, missing: [] };
  }

  const missing: string[] = [];
  for (const envVar of config.envVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get health check URL for a service
 */
export function getHealthCheckUrl(
  serviceName: string,
  environment: "production" | "staging" | "pr" = "production"
): string | null {
  const config = getServiceConfig(serviceName);
  if (!config) return null;

  // Use Railway internal URLs if available
  const internalUrl = process.env[`${serviceName.toUpperCase().replace(/-/g, "_")}_INTERNAL_URL`];
  if (internalUrl) {
    return `${internalUrl}${config.healthCheckPath}`;
  }

  // Fallback to custom domain or Railway domain
  const domain = config.customDomain || config.railwayDomain;
  if (domain) {
    const protocol = environment === "production" ? "https" : "http";
    return `${protocol}://${domain}${config.healthCheckPath}`;
  }

  // Last resort: localhost (only works in local dev)
  return `http://localhost:${config.port}${config.healthCheckPath}`;
}
