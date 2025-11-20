/**
 * Synqra Founder Pilot - TypeScript Types
 */

export interface PilotApplication {
  id: string;
  name: string;
  email: string;
  businessName: string;
  businessType: BusinessType;
  website?: string;
  challenge: string;
  goals: string;
  startDate?: string;
  referralSource?: string;
  agreedToTerms: boolean;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export type BusinessType =
  | "creator"
  | "ecommerce"
  | "service"
  | "agency"
  | "consultant"
  | "saas"
  | "other";

export type ApplicationStatus = "pending" | "reviewing" | "accepted" | "declined";

export interface PilotMetrics {
  totalApplications: number;
  pendingCount: number;
  acceptedCount: number;
  declinedCount: number;
  acceptanceRate: number;
  avgResponseTime: string;
}
