"use client";

import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import {
  Plus,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";

const ContentPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");

  const contentItems = [
    {
      id: 1,
      type: "Image Post",
      platform: "Instagram",
      content:
        "Introducing our latest timepiece collection. Crafted with precision...",
      status: "Published",
      engagement: "2.4K",
      date: "2 hours ago",
      aiGenerated: true,
    },
    {
      id: 2,
      type: "Carousel",
      platform: "Instagram",
      content: "Behind the scenes: The making of luxury",
      status: "Scheduled",
      engagement: "-",
      date: "Today, 6:00 PM",
      aiGenerated: true,
    },
    {
      id: 3,
      type: "Article",
      platform: "LinkedIn",
      content: "The Evolution of Luxury in the Digital Age",
      status: "Draft",
      engagement: "-",
      date: "Draft",
      aiGenerated: false,
    },
    {
      id: 4,
      type: "Thread",
      platform: "Twitter",
      content: "Product spotlight: 8 tweets showcasing our craftsmanship",
      status: "Published",
      engagement: "1.8K",
      date: "1 day ago",
      aiGenerated: true,
    },
  ];

  const tabs = [
    { id: "all", label: "All Content" },
    { id: "published", label: "Published" },
    { id: "scheduled", label: "Scheduled" },
    { id: "drafts", label: "Drafts" },
  ];

  return (
    <DashboardLayout activePage="content">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTab === tab.id
                  ? "bg-gradient-gold text-noid-black"
                  : "text-noid-silver hover:text-noid-white hover:bg-noid-charcoal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-gold text-noid-black font-medium rounded-lg hover:shadow-gold-glow transition-all">
          <Sparkles className="w-5 h-5" />
          Generate with AI
        </button>
      </div>

      {/* AI Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light hover:border-noid-gold/30 transition-all cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-gold rounded-lg">
              <ImageIcon className="w-6 h-6 text-noid-black" />
            </div>
            <h3 className="text-lg font-medium text-noid-white">Image Post</h3>
          </div>
          <p className="text-sm text-noid-silver">
            Generate AI-powered image posts with captions optimized for
            engagement
          </p>
        </div>

        <div className="bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light hover:border-noid-gold/30 transition-all cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-gold rounded-lg">
              <FileText className="w-6 h-6 text-noid-black" />
            </div>
            <h3 className="text-lg font-medium text-noid-white">Article</h3>
          </div>
          <p className="text-sm text-noid-silver">
            Create long-form content with AI research and brand voice
            consistency
          </p>
        </div>

        <div className="bg-noid-charcoal rounded-xl p-6 border border-noid-charcoal-light hover:border-noid-gold/30 transition-all cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-gold rounded-lg">
              <Plus className="w-6 h-6 text-noid-black" />
            </div>
            <h3 className="text-lg font-medium text-noid-white">
              Batch Generate
            </h3>
          </div>
          <p className="text-sm text-noid-silver">
            Generate multiple posts at once for the entire week
          </p>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-noid-charcoal rounded-xl border border-noid-charcoal-light">
        <div className="p-6 border-b border-noid-charcoal-light">
          <h3 className="text-xl font-display text-noid-white">
            Content Library
          </h3>
        </div>
        <div className="divide-y divide-noid-charcoal-light">
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="p-6 hover:bg-noid-charcoal-light transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium text-noid-gold">
                      {item.platform}
                    </span>
                    <span className="text-xs text-noid-silver">•</span>
                    <span className="text-xs text-noid-silver">
                      {item.type}
                    </span>
                    {item.aiGenerated && (
                      <>
                        <span className="text-xs text-noid-silver">•</span>
                        <span className="flex items-center gap-1 text-xs text-purple-400">
                          <Sparkles className="w-3 h-3" />
                          AI Generated
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-noid-white font-medium mb-2">
                    {item.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-noid-silver">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.status === "Published"
                          ? "bg-green-400/10 text-green-400"
                          : item.status === "Scheduled"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-noid-charcoal-light text-noid-silver"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span>{item.date}</span>
                    {item.engagement !== "-" && (
                      <span>{item.engagement} engagements</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-noid-charcoal rounded-lg text-noid-silver hover:text-noid-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-noid-charcoal rounded-lg text-noid-silver hover:text-noid-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-noid-charcoal rounded-lg text-noid-silver hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
