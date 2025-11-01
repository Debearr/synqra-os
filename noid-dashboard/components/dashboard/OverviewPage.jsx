import React from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Target,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';

const OverviewPage = () => {
  const metrics = [
    {
      title: 'Total Posts',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: FileText,
      color: 'gold'
    },
    {
      title: 'Engagement Rate',
      value: '8.4%',
      change: '+2.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'gold'
    },
    {
      title: 'Reach',
      value: '2.4M',
      change: '+18.2%',
      trend: 'up',
      icon: Users,
      color: 'gold'
    },
    {
      title: 'Automation Score',
      value: '94%',
      change: '+5%',
      trend: 'up',
      icon: Zap,
      color: 'gold'
    }
  ];

  const recentActivity = [
    {
      type: 'success',
      title: 'Content published',
      description: 'Instagram carousel - "Luxury Watch Collection"',
      time: '5 minutes ago'
    },
    {
      type: 'success',
      title: 'AI generation complete',
      description: 'Generated 10 posts for next week',
      time: '23 minutes ago'
    },
    {
      type: 'pending',
      title: 'Pending approval',
      description: 'LinkedIn article - "Brand Evolution"',
      time: '1 hour ago'
    },
    {
      type: 'success',
      title: 'Analytics updated',
      description: 'Weekly performance report available',
      time: '2 hours ago'
    },
    {
      type: 'success',
      title: 'Schedule optimized',
      description: 'AI adjusted posting times for peak engagement',
      time: '3 hours ago'
    }
  ];

  const upcomingPosts = [
    {
      platform: 'Instagram',
      content: 'New collection reveal - Behind the scenes',
      scheduledFor: 'Today, 6:00 PM',
      status: 'scheduled'
    },
    {
      platform: 'LinkedIn',
      content: 'Industry insights: Luxury market trends',
      scheduledFor: 'Tomorrow, 9:00 AM',
      status: 'scheduled'
    },
    {
      platform: 'Twitter',
      content: 'Product spotlight thread (8 tweets)',
      scheduledFor: 'Tomorrow, 2:00 PM',
      status: 'scheduled'
    }
  ];

  return (
    <DashboardLayout activePage="overview">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUp : ArrowDown;
          
          return (
            <div 
              key={metric.title}
              className="bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light hover:border-noid-gold/30 transition-all hover:shadow-gold-glow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-gold rounded-lg`}>
                  <Icon className="w-6 h-6 text-noid-black" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{metric.change}</span>
                </div>
              </div>
              <h3 className="text-sm text-noid-silver mb-1">{metric.title}</h3>
              <p className="text-3xl font-bold text-noid-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-noid-charcoal rounded-xl border border-noid-charcoal-light">
          <div className="p-6 border-b border-noid-charcoal-light">
            <h3 className="text-xl font-display text-noid-white">Recent Activity</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-noid-black hover:bg-noid-charcoal-light transition-colors"
              >
                <div className={`mt-1 ${
                  activity.type === 'success' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {activity.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-noid-white font-medium">{activity.title}</p>
                  <p className="text-sm text-noid-silver mt-1">{activity.description}</p>
                  <p className="text-xs text-noid-silver/60 mt-2">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Posts */}
        <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light">
          <div className="p-6 border-b border-noid-charcoal-light">
            <h3 className="text-xl font-display text-noid-white">Upcoming Posts</h3>
          </div>
          <div className="p-6 space-y-4">
            {upcomingPosts.map((post, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg bg-noid-black border border-noid-charcoal-light"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-noid-gold">{post.platform}</span>
                  <span className="text-xs text-green-400">Scheduled</span>
                </div>
                <p className="text-sm text-noid-white mb-3">{post.content}</p>
                <div className="flex items-center gap-2 text-xs text-noid-silver">
                  <Clock className="w-3 h-3" />
                  {post.scheduledFor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6 bg-gradient-gold rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-noid-black/20 rounded-lg">
            <Target className="w-6 h-6 text-noid-black" />
          </div>
          <div>
            <h4 className="text-lg font-display text-noid-black mb-2">AI Recommendation</h4>
            <p className="text-noid-black/80">
              Your engagement peaks on Tuesdays at 6 PM and Thursdays at 2 PM. 
              Consider scheduling premium content during these windows for maximum reach.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OverviewPage;
