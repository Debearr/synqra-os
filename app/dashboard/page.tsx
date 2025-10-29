'use client';

import { motion } from 'framer-motion';

export default function DashboardPage() {
  const stats = [
    { label: 'Active Automations', value: '12', icon: '⚡', color: 'teal' },
    { label: 'Tasks Completed', value: '1,247', icon: '◆', color: 'gold' },
    { label: 'Time Saved', value: '48h', icon: '◈', color: 'blue' },
    { label: 'Success Rate', value: '98.5%', icon: '◉', color: 'sage' },
  ];

  const recentActivity = [
    { action: 'Automation "Social Media Sync" completed', time: '2 min ago', status: 'success' },
    { action: 'New workflow created: "Email Digest"', time: '15 min ago', status: 'info' },
    { action: 'API integration updated', time: '1 hour ago', status: 'success' },
    { action: 'System backup completed', time: '2 hours ago', status: 'success' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-heading font-bold gradient-gold mb-2">
          Welcome to NØID
        </h1>
        <p className="text-silver-mist/60 text-lg">
          Your automation command center. Everything synced, everything flowing.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            className="glassmorphism rounded-lg p-6 card-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`text-4xl ${
                stat.color === 'teal' ? 'text-teal-neon' :
                stat.color === 'gold' ? 'text-gold' :
                stat.color === 'blue' ? 'text-electric-blue' :
                'text-sage'
              }`}>
                {stat.icon}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                stat.color === 'teal' ? 'bg-teal-neon/10 text-teal-neon' :
                stat.color === 'gold' ? 'bg-gold/10 text-gold' :
                stat.color === 'blue' ? 'bg-electric-blue/10 text-electric-blue' :
                'bg-sage/10 text-sage'
              }`}>
                Live
              </span>
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-silver-mist mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-silver-mist/60">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 glassmorphism rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-silver-mist">
              Recent Activity
            </h2>
            <button className="text-sm text-teal-neon hover:text-teal-neon/80 transition-colors">
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-teal-neon animate-glow-pulse' :
                  activity.status === 'info' ? 'bg-electric-blue' :
                  'bg-gold'
                }`} />
                <div className="flex-1">
                  <p className="text-silver-mist text-sm">{activity.action}</p>
                  <p className="text-silver-mist/40 text-xs mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glassmorphism rounded-lg p-6"
        >
          <h2 className="text-2xl font-heading font-bold text-silver-mist mb-6">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black font-body font-semibold hover:opacity-90 transition-all transform hover:scale-105">
              ⚡ New Automation
            </button>
            <button className="w-full px-4 py-3 rounded-lg border border-teal-neon/30 text-teal-neon hover:bg-teal-neon/10 transition-all">
              ◆ View Analytics
            </button>
            <button className="w-full px-4 py-3 rounded-lg border border-white/10 text-silver-mist hover:bg-white/5 transition-all">
              ◈ Integration Hub
            </button>
            <button className="w-full px-4 py-3 rounded-lg border border-white/10 text-silver-mist hover:bg-white/5 transition-all">
              ◉ API Docs
            </button>
          </div>

          {/* Status Indicator */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-teal-neon rounded-full animate-glow-pulse" />
              <div>
                <p className="text-sm font-body font-medium text-silver-mist">
                  All Systems Operational
                </p>
                <p className="text-xs text-silver-mist/40">Last checked: Just now</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Premium Feature Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glassmorphism rounded-lg p-8 bg-gradient-to-r from-gold/10 to-rose-gold/10 border-gold/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-heading font-bold gradient-gold mb-2">
              Unlock Premium Features
            </h3>
            <p className="text-silver-mist/60">
              Advanced automation, unlimited workflows, priority support, and more.
            </p>
          </div>
          <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-gold to-rose-gold text-matte-black font-body font-semibold hover:opacity-90 transition-all transform hover:scale-105">
            Upgrade Now →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
