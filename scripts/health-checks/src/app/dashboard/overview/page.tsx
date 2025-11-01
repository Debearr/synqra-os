'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Zap, 
  BarChart3, 
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const metrics = [
  { name: 'Total Posts', value: '247', change: '+12%', changeType: 'positive' },
  { name: 'Engagement Rate', value: '8.2%', change: '+0.3%', changeType: 'positive' },
  { name: 'Followers', value: '12.4K', change: '+156', changeType: 'positive' },
  { name: 'Automation Runs', value: '89', change: '+23', changeType: 'positive' },
]

const quickActions = [
  { name: 'Create Post', icon: Plus, href: '/dashboard/content' },
  { name: 'View Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { name: 'Setup Automation', icon: Zap, href: '/dashboard/automation' },
  { name: 'Manage Brand', icon: TrendingUp, href: '/dashboard/brand' },
]

const recentActivity = [
  { id: 1, action: 'Post published', platform: 'Instagram', time: '2 min ago', status: 'success' },
  { id: 2, action: 'Automation completed', platform: 'Twitter', time: '15 min ago', status: 'success' },
  { id: 3, action: 'Analytics updated', platform: 'LinkedIn', time: '1 hour ago', status: 'info' },
  { id: 4, action: 'Brand assets uploaded', platform: 'All', time: '2 hours ago', status: 'success' },
]

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-synqra-charcoal">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here's what's happening with your social media automation.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                <p className="text-2xl font-semibold text-synqra-charcoal">{metric.value}</p>
              </div>
              <div className={`flex items-center text-sm ${
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {metric.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-light text-synqra-charcoal mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.a
              key={action.name}
              href={action.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-primary/20"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-synqra-charcoal">{action.name}</p>
                  <p className="text-sm text-muted-foreground">Get started</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-light text-synqra-charcoal mb-6">Recent Activity</h2>
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-synqra-charcoal">Latest Updates</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${
                    activity.status === 'success' ? 'bg-green-100' : 
                    activity.status === 'info' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : activity.status === 'info' ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-synqra-charcoal">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.platform}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
