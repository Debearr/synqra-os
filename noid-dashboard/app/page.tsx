import DashboardLayout from './components/dashboard/DashboardLayout';
import SCINMonitor from './components/dashboard/SCINMonitor';
import AuraFXSignals from './components/dashboard/AuraFXSignals';
import LumenMetrics from './components/dashboard/LumenMetrics';
import LuxGridControl from './components/dashboard/LuxGridControl';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              Welcome to Synqra OS
            </h1>
            <p className="text-gray-400 text-lg">
              Your AI-Powered Automation Intelligence Platform
            </p>
          </div>

          {/* Dashboard Grid - Responsive 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Left - SCIN Monitor */}
            <div className="animate-fadeIn">
              <SCINMonitor />
            </div>

            {/* Top Right - AuraFX Signals */}
            <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <AuraFXSignals />
            </div>

            {/* Bottom Left - Lumen Metrics */}
            <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <LumenMetrics />
            </div>

            {/* Bottom Right - LuxGrid Control */}
            <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <LuxGridControl />
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-8 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">99.8%</div>
                <div className="text-sm text-gray-400">System Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-gray-400">Active Monitoring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">156</div>
                <div className="text-sm text-gray-400">Active Processes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-400">12</div>
                <div className="text-sm text-gray-400">Issues Resolved</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
