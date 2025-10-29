"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <Header onToggleSidebar={() => setIsSidebarOpen((v) => !v)} />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden={!isSidebarOpen}
        />
      )}

      {/* Main content */}
      <div className="md:pl-72">
        <main className="px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
