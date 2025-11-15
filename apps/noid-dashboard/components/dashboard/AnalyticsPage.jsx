"use client";

"use client";

import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle,
  Share2,
  Download,
  Filter
} from 'lucide-react';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const performanceMetrics = [
    {
      title: 'Total Impressions',
      value: '2.4M',
      change: '+18.2%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Engagement Rate',
      value: '8.4%',
      change: '+2.3%',
      trend: 'up',
      icon: Heart
    },
    {
      title: 'Total Engagements',
      value: '156K',
      change: '+12.5%',
      trend: 'up',
      icon: MessageCircle
    },
    {
      title: 'Share Rate',
      value: '4.2%',
      change: '+1.8%',
      trend: 'up',
      icon: Share2
    }
  ];

  const platformPerformance = [
    { platform: 'Instagram', posts: 342, reach: '1.2M', engagement: '9.2%', color: 'from-pink-500 to-purple-500' },
    { platform: 'LinkedIn', posts: 124, reach: '890K', engagement: '7.8%', color: 'from-blue-500 to-blue-600' },
    { platform: 'Twitter', posts: 456, reach: '310K', engagement: '6.4%', color: 'from-sky-400 to-sky-500' },
  ];

  const topPosts = [
    {
      platform: 'Instagram',
      content: 'Luxury watch collection reveal - Behind the scenes',
      impressions: '124K',
      engagement: '12.4%',
      date: '3 days ago'
    },
    {
      platform: 'LinkedIn',
      content: 'The Evolution of Luxury in the Digital Age',
      impressions: '98K',
      engagement: '11.2%',
      date: '5 days ago'
    },
    {
      platform: 'Twitter',
      content: 'Product spotlight: Craftsmanship thread',
      impressions: '87K',
      engagement: '10.8%',
      date: '1 week ago'
    }
  ];

  return (
    <DashboardLayout activePage="analytics">
      {/* Analytics Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {['7d', '30d', '90d', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-gradient-gold text-noid-black'
                  : 'text-noid-silver hover:text-noid-white hover:bg-noid-charcoal'
              }`}
            >
              Last {range === 'All' ? 'All Time' : range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-noid-charcoal text-noid-white rounded-lg hover:bg-noid-charcoal-light transition-colors border border-noid-charcoal-light">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;
          
          return (
            <div 
              key={metric.title}
              className="bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-gold rounded-lg">
                  <Icon className="w-6 h-6 text-noid-black" />
                </div>
                <span className="text-sm text-green-400 font-medium">{metric.change}</span>
              </div>
              <h3 className="text-sm text-noid-silver mb-1">{metric.title}</h3>
              <p className="text-3xl font-bold text-noid-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6 mb-8">
        <h3 className="text-xl font-display text-noid-white mb-6">Engagement Trend</h3>
        <div className="h-64 flex items-center justify-center bg-noid-black rounded-lg">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 text-noid-gold mx-auto mb-4" />
            <p className="text-noid-silver">Chart visualization would render here</p>
            <p className="text-sm text-noid-silver/60 mt-2">Use Recharts or Chart.js for implementation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light">
          <div className="p-6 border-b border-noid-charcoal-light">
            <h3 className="text-xl font-display text-noid-white">Platform Performance</h3>
          </div>
          <div className="p-6 space-y-4">
            {platformPerformance.map((platform) => (
              <div key={platform.platform} className="p-4 bg-noid-black rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-noid-white">{platform.platform}</h4>
                  <span className="text-sm text-noid-gold font-medium">{platform.engagement}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-noid-silver mb-1">Posts</p>
                    <p className="text-lg font-bold text-noid-white">{platform.posts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-noid-silver mb-1">Reach</p>
                    <p className="text-lg font-bold text-noid-white">{platform.reach}</p>
                  </div>
                </div>
                <div className={`h-2 bg-gradient-to-r ${platform.color} rounded-full mt-3`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light">
          <div className="p-6 border-b border-noid-charcoal-light">
            <h3 className="text-xl font-display text-noid-white">Top Performing Posts</h3>
          </div>
          <div className="p-6 space-y-4">
            {topPosts.map((post, index) => (
              <div key={index} className="p-4 bg-noid-black rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-noid-gold">{post.platform}</span>
                  <span className="text-xs text-noid-silver">•</span>
                  <span className="text-xs text-noid-silver">{post.date}</span>
                </div>
                <p className="text-sm text-noid-white mb-3">{post.content}</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-noid-silver">Impressions</p>
                    <p className="text-sm font-bold text-noid-white">{post.impressions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-noid-silver">Engagement</p>
                    <p className="text-sm font-bold text-green-400">{post.engagement}</p>
                  </div>
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
            <TrendingUp className="w-6 h-6 text-noid-black" />
          </div>
          <div>
            <h4 className="text-lg font-display text-noid-black mb-2">Performance Insights</h4>
            <p className="text-noid-black/80 mb-3">
              Your Instagram carousel posts are outperforming single images by 42%. 
              Consider increasing carousel content for better engagement.
            </p>
            <p className="text-noid-black/80">
              Peak engagement times: Tuesday 6PM (+18%) and Thursday 2PM (+15%)
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;


