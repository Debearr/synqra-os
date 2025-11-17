'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ============================================================
 * SYNQRA SEARCH BAR COMPONENT
 * ============================================================
 * Glassmorphic search bar with:
 * - Real-time search
 * - Keyboard shortcuts (⌘K)
 * - Animated results
 * - Brand consistency
 */

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'agent' | 'content' | 'settings' | 'docs';
  url: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Sales Agent',
    description: 'AI-powered sales content generator',
    category: 'agent',
    url: '/agents',
  },
  {
    id: '2',
    title: 'Service Agent',
    description: 'Customer service response automation',
    category: 'agent',
    url: '/agents',
  },
  {
    id: '3',
    title: 'Content Library',
    description: 'View all generated content',
    category: 'content',
    url: '/content',
  },
  {
    id: '4',
    title: 'Settings',
    description: 'Configure your Synqra workspace',
    category: 'settings',
    url: '/admin',
  },
];

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  useEffect(() => {
    if (query.trim()) {
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    setQuery('');
    window.location.href = url;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'agent':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'content':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="group relative flex items-center gap-3 px-4 py-2 rounded-full 
                   bg-white/5 border border-white/10 hover:bg-white/10 
                   transition-all duration-200"
      >
        <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm text-white/50">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 
                       text-xs font-mono text-white/40 bg-white/5 border border-white/10 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
            />

            {/* Search Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search agents, content, settings..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/40 
                             outline-none text-sm"
                    autoComplete="off"
                  />
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 
                                 text-xs font-mono text-white/40 bg-white/5 border border-white/10 rounded">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="py-2">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.url)}
                          className="w-full flex items-start gap-3 px-4 py-3 
                                   hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="mt-0.5 text-emerald-400">
                            {getCategoryIcon(result.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">
                              {result.title}
                            </div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {result.description}
                            </div>
                          </div>
                          <div className="text-xs text-white/30 uppercase tracking-wider">
                            {result.category}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : query ? (
                    <div className="py-8 text-center text-sm text-white/40">
                      No results found for "{query}"
                    </div>
                  ) : (
                    <div className="py-8 px-4 space-y-4">
                      <div className="text-xs uppercase tracking-wider text-white/40">
                        Quick Actions
                      </div>
                      <div className="space-y-1">
                        {mockResults.slice(0, 4).map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result.url)}
                            className="w-full flex items-center gap-3 px-3 py-2 
                                     hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="text-emerald-400">
                              {getCategoryIcon(result.category)}
                            </div>
                            <span className="text-sm text-white/70">
                              {result.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
