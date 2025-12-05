"use client";

import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus
} from 'lucide-react';
import { Card } from '@/app/components/ui/Card';
import { EmptyState } from '@/app/components/ui/EmptyState';

const CalendarPage = () => {
  const [currentView, setCurrentView] = useState('month');

  const scheduledPosts = [
    { date: '2025-10-26', time: '18:00', platform: 'Instagram', content: 'Collection reveal', type: 'carousel' },
    { date: '2025-10-27', time: '09:00', platform: 'LinkedIn', content: 'Industry insights', type: 'article' },
    { date: '2025-10-27', time: '14:00', platform: 'Twitter', content: 'Product spotlight', type: 'thread' },
    { date: '2025-10-28', time: '11:00', platform: 'Instagram', content: 'Behind the scenes', type: 'image' },
    { date: '2025-10-29', time: '16:00', platform: 'LinkedIn', content: 'Thought leadership', type: 'article' },
    { date: '2025-10-30', time: '19:00', platform: 'Instagram', content: 'User testimonial', type: 'story' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generate calendar days (simplified)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 6;
    const date = new Date(2025, 9, day); // October 2025
    return {
      date: date.getDate(),
      month: date.getMonth(),
      fullDate: date.toISOString().split('T')[0],
      isToday: date.toDateString() === new Date().toDateString()
    };
  });

  const getPostsForDate = (dateStr) => {
    return scheduledPosts.filter(post => post.date === dateStr);
  };

  return (
    <DashboardLayout activePage="calendar">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-noid-charcoal rounded-lg text-noid-silver hover:text-noid-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-display text-noid-white">October 2025</h2>
          <button className="p-2 hover:bg-noid-charcoal rounded-lg text-noid-silver hover:text-noid-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-noid-charcoal rounded-lg p-1">
            {['Day', 'Week', 'Month'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === view.toLowerCase()
                    ? 'bg-gradient-gold text-noid-black'
                    : 'text-noid-silver hover:text-noid-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
            <Plus className="w-5 h-5" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-0 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-noid-charcoal-light">
          {days.map((day) => (
            <div
              key={day}
              className="p-4 text-center text-sm font-medium text-noid-gold"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const posts = getPostsForDate(day.fullDate);
            const isCurrentMonth = day.month === 9; // October

            return (
              <div
                key={index}
                className={`min-h-32 p-3 border-b border-r border-noid-charcoal-light ${
                  !isCurrentMonth ? 'bg-noid-black/50' : ''
                } ${day.isToday ? 'bg-noid-gold/5' : ''} hover:bg-noid-charcoal-light transition-colors cursor-pointer`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isToday
                    ? 'text-noid-gold'
                    : isCurrentMonth
                    ? 'text-noid-white'
                    : 'text-noid-silver/30'
                }`}>
                  {day.date}
                </div>

                {/* Posts for this day */}
                <div className="space-y-1">
                  {posts.map((post, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-xs ${
                        post.platform === 'Instagram'
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : post.platform === 'LinkedIn'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{post.time}</span>
                      </div>
                      <p className="truncate">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Posts Sidebar */}
      <Card className="mt-6">
        <h3 className="text-lg font-display text-noid-white mb-4">Next 7 Days</h3>
        {scheduledPosts.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-16 h-16" />}
            title="No scheduled posts"
            description="Schedule your first post to see it appear on the calendar."
          />
        ) : (
          <div className="space-y-3">
            {scheduledPosts.slice(0, 5).map((post, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-3 bg-noid-black rounded-lg"
            >
              <div className="flex-shrink-0 text-center">
                <div className="text-xs text-noid-silver">{new Date(post.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                <div className="text-lg font-bold text-noid-white">{new Date(post.date).getDate()}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-noid-gold">{post.platform}</span>
                  <span className="text-xs text-noid-silver">•</span>
                  <span className="text-xs text-noid-silver">{post.time}</span>
                </div>
                <p className="text-sm text-noid-white">{post.content}</p>
              </div>
            </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default CalendarPage;

