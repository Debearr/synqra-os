"use client";

import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  Sparkles, 
  BookOpen, 
  Settings,
  Plus,
  Check,
  Edit
} from 'lucide-react';

const BrandVoicePage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const brandAttributes = [
    { name: 'Sophisticated', active: true },
    { name: 'Premium', active: true },
    { name: 'Innovative', active: true },
    { name: 'Exclusive', active: true },
    { name: 'Timeless', active: true },
    { name: 'Bold', active: false },
    { name: 'Playful', active: false },
    { name: 'Minimalist', active: true },
  ];

  const toneGuidelines = [
    {
      category: 'Vocabulary',
      description: 'Use elevated, precise language',
      examples: ['Crafted', 'Curated', 'Heritage', 'Excellence', 'Distinguished']
    },
    {
      category: 'Sentence Structure',
      description: 'Mix short impactful statements with longer descriptive phrases',
      examples: ['Power in simplicity.', 'Where heritage meets modern craftsmanship.']
    },
    {
      category: 'Emotional Tone',
      description: 'Confident yet approachable, aspirational but authentic',
      examples: ['Luxury redefined', 'Experience the difference']
    }
  ];

  const trainingExamples = [
    {
      platform: 'Instagram',
      example: 'Introducing our Heritage Collection. Where timeless design meets modern craftsmanship. Each piece tells a story of excellence.',
      rating: '98% match'
    },
    {
      platform: 'LinkedIn',
      example: 'The evolution of luxury isn\'t about following trends—it\'s about setting standards. Our approach to design reflects decades of expertise.',
      rating: '96% match'
    },
    {
      platform: 'Twitter',
      example: 'Excellence isn\'t an act. It\'s a habit. Our commitment to quality shows in every detail.',
      rating: '94% match'
    }
  ];

  return (
    <DashboardLayout activePage="brand-voice">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 mb-8 border-b border-noid-charcoal-light">
        {['Overview', 'Training', 'Guidelines'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === tab.toLowerCase()
                ? 'text-noid-gold'
                : 'text-noid-silver hover:text-noid-white'
            }`}
          >
            {tab}
            {activeTab === tab.toLowerCase() && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold"></div>
            )}
          </button>
        ))}
      </div>

      {/* Brand Identity Section */}
      <div className="bg-gradient-gold rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-noid-black/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-noid-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-display text-noid-black mb-2">NØID Brand Voice</h3>
            <p className="text-noid-black/80 mb-4">
              Sophisticated, premium, and timeless. We speak to those who appreciate 
              excellence and understand the value of authentic craftsmanship.
            </p>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-noid-black/10 rounded-lg">
                <span className="text-sm text-noid-black font-medium">94% AI Consistency</span>
              </div>
              <div className="px-4 py-2 bg-noid-black/10 rounded-lg">
                <span className="text-sm text-noid-black font-medium">1,247 Posts Trained</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-noid-black text-noid-gold rounded-lg hover:bg-noid-charcoal transition-colors">
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Brand Attributes */}
      <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-noid-white">Brand Attributes</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-noid-gold hover:bg-noid-charcoal-light rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add Attribute
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {brandAttributes.map((attr) => (
            <button
              key={attr.name}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                attr.active
                  ? 'bg-gradient-gold text-noid-black'
                  : 'bg-noid-black text-noid-silver hover:text-noid-white border border-noid-charcoal-light'
              }`}
            >
              {attr.active && <Check className="w-4 h-4 inline mr-2" />}
              {attr.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Guidelines */}
      <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6 mb-8">
        <h3 className="text-xl font-display text-noid-white mb-6">Tone Guidelines</h3>
        <div className="space-y-6">
          {toneGuidelines.map((guideline) => (
            <div key={guideline.category} className="p-4 bg-noid-black rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-noid-gold" />
                <h4 className="text-lg font-medium text-noid-white">{guideline.category}</h4>
              </div>
              <p className="text-noid-silver mb-3">{guideline.description}</p>
              <div className="flex flex-wrap gap-2">
                {guideline.examples.map((example, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-noid-charcoal-light text-noid-gold text-sm rounded-lg border border-noid-gold/20"
                  >
                    “{example}”
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Examples */}
      <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-noid-white">Training Examples</h3>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
            <Plus className="w-5 h-5" />
            Add Example
          </button>
        </div>
        <div className="space-y-4">
          {trainingExamples.map((example, index) => (
            <div key={index} className="p-4 bg-noid-black rounded-lg border border-noid-charcoal-light">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-noid-gold">{example.platform}</span>
                <span className="px-3 py-1 bg-green-400/10 text-green-400 text-xs font-medium rounded-full">
                  {example.rating}
                </span>
              </div>
              <p className="text-noid-white leading-relaxed">{example.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Training Status */}
      <div className="mt-6 bg-noid-charcoal rounded-xl border border-noid-charcoal-light p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-noid-white mb-2">AI Training Status</h4>
            <p className="text-noid-silver">Your brand voice model is trained on 1,247 approved posts</p>
          </div>
          <button className="px-6 py-3 bg-noid-charcoal-light text-noid-white rounded-lg hover:bg-noid-charcoal border border-noid-charcoal-light transition-colors">
            <Settings className="w-5 h-5 inline mr-2" />
            Retrain Model
          </button>
        </div>
        <div className="mt-4 h-2 bg-noid-black rounded-full overflow-hidden">
          <div className="h-full w-[94%] bg-gradient-gold"></div>
        </div>
        <p className="text-xs text-noid-silver mt-2">94% consistency across all AI-generated content</p>
      </div>
    </DashboardLayout>
  );
};

export default BrandVoicePage;

