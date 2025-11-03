export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  autoHealing: boolean;
  activeIssues: number;
  resolvedToday: number;
}

export interface TradingSignal {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell' | 'hold';
  asset: string;
  confidence: number;
  price: number;
  change: number;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

export interface AutomationToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'trading' | 'monitoring' | 'analytics' | 'system';
}

export interface DashboardData {
  systemHealth: SystemHealth;
  tradingSignals: TradingSignal[];
  metrics: SystemMetric[];
  automations: AutomationToggle[];
}
