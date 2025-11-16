"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  Link2, 
  Settings,
  Menu,
  X
} from 'lucide-react';

const DashboardLayout = ({ children, activePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Content', icon: FileText, href: '/dashboard/content' },
    { name: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
    { name: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    { name: 'Brand Voice', icon: Sparkles, href: '/dashboard/brand-voice' },
    { name: 'Integrations', icon: Link2, href: '/dashboard/integrations' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-noid-black">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-noid-charcoal border-r border-noid-charcoal-light transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-noid-charcoal-light">
          <h1 className="text-2xl font-display text-noid-gold">NØID</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-noid-silver hover:text-noid-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name.toLowerCase().replace(' ', '-');
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-gold text-noid-black font-medium shadow-gold-glow'
                    : 'text-noid-silver hover:text-noid-white hover:bg-noid-charcoal-light'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-noid-charcoal-light">
          <div className="px-4 py-3 bg-noid-black rounded-lg">
            <p className="text-xs text-noid-silver">Enterprise Plan</p>
            <p className="text-sm font-medium text-noid-white mt-1">AuraFX Studio</p>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-noid-charcoal rounded-lg text-noid-gold"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Main content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-noid-black/80 backdrop-blur-lg border-b border-noid-charcoal-light">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-display text-noid-white capitalize">
                {activePage.replace('-', ' ')}
              </h2>
              <p className="text-sm text-noid-silver mt-1">
                Enterprise AI Social Media Automation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-noid-charcoal rounded-lg border border-noid-gold/20">
                <span className="text-xs text-noid-silver">Automation</span>
                <p className="text-lg font-bold text-noid-gold">94%</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
