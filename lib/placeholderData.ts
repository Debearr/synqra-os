// Placeholder data for Synqra Dashboard

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export interface Post {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  platform: string[];
  scheduledDate?: string;
  content: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  platform: string;
  status: 'pending' | 'scheduled' | 'posted';
}

export interface AnalyticsData {
  platform: string;
  engagement: number;
  reach: number;
  clicks: number;
}

export interface BrandVoiceSetting {
  tone: string;
  keywords: string[];
  avoidWords: string[];
}

export interface Integration {
  name: string;
  status: 'connected' | 'disconnected';
  icon: string;
  description: string;
}

// Sample Metrics for Overview
export const sampleMetrics: Metric[] = [
  { label: 'Total Posts', value: '247', change: '+12%', trend: 'up' },
  { label: 'Engagement Rate', value: '4.8%', change: '+0.3%', trend: 'up' },
  { label: 'Reach', value: '125K', change: '+8%', trend: 'up' },
  { label: 'Active Campaigns', value: '5', change: '-1', trend: 'down' },
];

// Sample Posts for Content Library
export const samplePosts: Post[] = [
  {
    id: '1',
    title: 'NØID Brand Launch Campaign',
    status: 'published',
    platform: ['Instagram', 'Twitter'],
    content: 'Introducing NØID - Where craft meets automation. #BrandLaunch',
  },
  {
    id: '2',
    title: 'Weekly Product Showcase',
    status: 'scheduled',
    platform: ['LinkedIn', 'Facebook'],
    scheduledDate: '2025-10-30T10:00:00',
    content: 'Discover how Synqra transforms your content workflow.',
  },
  {
    id: '3',
    title: 'Behind the Scenes: Design Process',
    status: 'draft',
    platform: ['Instagram'],
    content: 'A peek into our creative process...',
  },
  {
    id: '4',
    title: 'Customer Success Story',
    status: 'scheduled',
    platform: ['Twitter', 'LinkedIn'],
    scheduledDate: '2025-10-31T14:00:00',
    content: 'How @CustomerX increased engagement by 300% with Synqra.',
  },
];

// Sample Calendar Events
export const sampleCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Morning Motivation Post',
    date: '2025-10-28',
    time: '09:00',
    platform: 'Instagram',
    status: 'scheduled',
  },
  {
    id: '2',
    title: 'Product Feature Highlight',
    date: '2025-10-29',
    time: '12:00',
    platform: 'Twitter',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Weekly Newsletter',
    date: '2025-10-30',
    time: '08:00',
    platform: 'Email',
    status: 'scheduled',
  },
  {
    id: '4',
    title: 'Community Spotlight',
    date: '2025-10-31',
    time: '15:00',
    platform: 'LinkedIn',
    status: 'pending',
  },
];

// Sample Analytics Data
export const sampleAnalytics: AnalyticsData[] = [
  { platform: 'Instagram', engagement: 4820, reach: 45200, clicks: 1250 },
  { platform: 'Twitter', engagement: 3240, reach: 32100, clicks: 890 },
  { platform: 'LinkedIn', engagement: 2180, reach: 28400, clicks: 650 },
  { platform: 'Facebook', engagement: 1920, reach: 21300, clicks: 420 },
];

// Sample Brand Voice Settings
export const sampleBrandVoice: BrandVoiceSetting = {
  tone: 'Professional yet approachable, bold and innovative',
  keywords: ['craft', 'automation', 'precision', 'luxury', 'innovation', 'NØID'],
  avoidWords: ['cheap', 'basic', 'generic', 'ordinary'],
};

// Sample Integrations
export const sampleIntegrations: Integration[] = [
  {
    name: 'Instagram',
    status: 'connected',
    icon: '📸',
    description: 'Post and schedule content to Instagram',
  },
  {
    name: 'Twitter',
    status: 'connected',
    icon: '🐦',
    description: 'Manage tweets and threads',
  },
  {
    name: 'LinkedIn',
    status: 'connected',
    icon: '💼',
    description: 'Professional network automation',
  },
  {
    name: 'Facebook',
    status: 'disconnected',
    icon: '👥',
    description: 'Connect your Facebook business page',
  },
  {
    name: 'TikTok',
    status: 'disconnected',
    icon: '🎵',
    description: 'Short-form video content automation',
  },
];
