"use client";

import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Zap,
  Users,
  Save
} from 'lucide-react';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('account');

  const settingsSections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <DashboardLayout activePage="settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-4 sticky top-24">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-gradient-gold text-noid-black font-medium'
                        : 'text-noid-silver hover:text-noid-white hover:bg-noid-charcoal-light'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Settings */}
          {activeSection === 'account' && (
            <>
              <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
                <h3 className="text-xl font-display text-noid-white mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-noid-silver mb-2">Company Name</label>
                    <input 
                      type="text" 
                      defaultValue="AuraFX Studio"
                      className="w-full px-4 py-3 bg-noid-black border border-noid-charcoal-light rounded-lg text-noid-white focus:border-noid-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-noid-silver mb-2">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="admin@aurafxstudio.com"
                      className="w-full px-4 py-3 bg-noid-black border border-noid-charcoal-light rounded-lg text-noid-white focus:border-noid-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-noid-silver mb-2">Industry</label>
                    <select className="w-full px-4 py-3 bg-noid-black border border-noid-charcoal-light rounded-lg text-noid-white focus:border-noid-gold focus:outline-none">
                      <option>Luxury Goods</option>
                      <option>Fashion</option>
                      <option>Jewelry & Watches</option>
                      <option>Automotive</option>
                      <option>Real Estate</option>
                    </select>
                  </div>
                </div>
                <button className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>

              <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
                <h3 className="text-xl font-display text-noid-white mb-4">Brand Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-noid-silver mb-2">Primary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        defaultValue="#D4AF37"
                        className="w-20 h-12 bg-noid-black border border-noid-charcoal-light rounded-lg cursor-pointer"
                      />
                      <span className="text-noid-white">#D4AF37</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-noid-silver mb-2">Website URL</label>
                    <input 
                      type="url" 
                      defaultValue="https://noid.luxury"
                      className="w-full px-4 py-3 bg-noid-black border border-noid-charcoal-light rounded-lg text-noid-white focus:border-noid-gold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Billing Settings */}
          {activeSection === 'billing' && (
            <>
              <div className="bg-gradient-gold rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-display text-noid-black mb-2">Enterprise Plan</h3>
                    <p className="text-noid-black/80">$6,000 / year</p>
                  </div>
                  <div className="px-4 py-2 bg-noid-black/10 rounded-lg">
                    <span className="text-sm text-noid-black font-medium">Active</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-noid-black/60">Next Billing</p>
                    <p className="text-lg font-bold text-noid-black">Oct 26, 2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-noid-black/60">Usage</p>
                    <p className="text-lg font-bold text-noid-black">Unlimited</p>
                  </div>
                  <div>
                    <p className="text-sm text-noid-black/60">Support</p>
                    <p className="text-lg font-bold text-noid-black">Priority 24/7</p>
                  </div>
                </div>
              </div>

              <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
                <h3 className="text-xl font-display text-noid-white mb-6">Payment Method</h3>
                <div className="flex items-center justify-between p-4 bg-noid-black rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-gold rounded-lg">
                      <CreditCard className="w-6 h-6 text-noid-black" />
                    </div>
                    <div>
                      <p className="text-noid-white font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-noid-silver">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-noid-gold hover:bg-noid-charcoal-light rounded-lg transition-colors">
                    Update
                  </button>
                </div>
              </div>

              <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
                <h3 className="text-xl font-display text-noid-white mb-6">Billing History</h3>
                <div className="space-y-3">
                  {[
                    { date: 'Oct 26, 2024', amount: '$6,000', status: 'Paid' },
                    { date: 'Oct 26, 2023', amount: '$6,000', status: 'Paid' },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-noid-black rounded-lg">
                      <div>
                        <p className="text-noid-white font-medium">{invoice.date}</p>
                        <p className="text-sm text-noid-silver">Enterprise Annual Plan</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-noid-white font-bold">{invoice.amount}</span>
                        <span className="px-3 py-1 bg-green-400/10 text-green-400 text-xs font-medium rounded-full">
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notifications Settings */}
          {activeSection === 'notifications' && (
            <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
              <h3 className="text-xl font-display text-noid-white mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Post Publishing', description: 'Get notified when posts are published', enabled: true },
                  { label: 'Approval Required', description: 'Alert when content needs approval', enabled: true },
                  { label: 'Performance Alerts', description: 'High engagement or issues detected', enabled: true },
                  { label: 'Weekly Reports', description: 'Receive weekly analytics summary', enabled: true },
                  { label: 'AI Recommendations', description: 'Get AI-powered content suggestions', enabled: false },
                  { label: 'Team Activity', description: 'Notifications about team member actions', enabled: false },
                ].map((pref, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-noid-black rounded-lg">
                    <div>
                      <p className="text-noid-white font-medium">{pref.label}</p>
                      <p className="text-sm text-noid-silver">{pref.description}</p>
                    </div>
                    <button className={`w-12 h-6 rounded-full transition-all ${
                      pref.enabled ? 'bg-gradient-gold' : 'bg-noid-charcoal-light'
                    }`}>
                      <div className={`w-5 h-5 bg-noid-black rounded-full transition-transform ${
                        pref.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Settings */}
          {activeSection === 'automation' && (
            <>
              <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
                <h3 className="text-xl font-display text-noid-white mb-6">Automation Level</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-noid-white font-medium">Auto-Publish</p>
                      <p className="text-sm text-noid-silver">Automatically publish AI-generated content</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-gradient-gold">
                      <div className="w-5 h-5 bg-noid-black rounded-full translate-x-6"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-noid-white font-medium">Smart Scheduling</p>
                      <p className="text-sm text-noid-silver">AI optimizes post timing</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-gradient-gold">
                      <div className="w-5 h-5 bg-noid-black rounded-full translate-x-6"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-noid-white font-medium">Batch Generation</p>
                      <p className="text-sm text-noid-silver">Auto-generate weekly content batches</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-gradient-gold">
                      <div className="w-5 h-5 bg-noid-black rounded-full translate-x-6"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-gold rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-noid-black" />
                  <div>
                    <h4 className="text-lg font-display text-noid-black mb-2">94% Automation Achieved</h4>
                    <p className="text-noid-black/80">
                      Your current settings enable near-complete automation while maintaining 
                      brand consistency and quality control.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

