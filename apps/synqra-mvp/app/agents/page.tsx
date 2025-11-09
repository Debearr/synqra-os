"use client";

import { useState } from "react";

/**
 * ============================================================
 * AGENT DASHBOARD
 * ============================================================
 * Test interface for Sales, Support, and Service agents
 */

type AgentRole = "sales" | "support" | "service" | "auto";

interface AgentResponse {
  agent: string;
  response: {
    answer: string;
    confidence: number;
    sources?: string[];
  };
  safety?: {
    recommendation: string;
    confidence: number;
  };
}

export default function AgentDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>("auto");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Determine endpoint
      const endpoint =
        selectedAgent === "auto"
          ? "/api/agents"
          : `/api/agents/${selectedAgent}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationId: `test-${Date.now()}`,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const examples = {
    sales: "How much does Synqra cost?",
    support: "I can't log in to my account",
    service: "I want to upgrade my plan",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">
            🤖 Synqra Agent System
          </h1>
          <p className="text-slate-400">
            Multi-agent voice system for Sales, Support, and Service
          </p>
        </header>

        {/* Agent Selection */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <label className="mb-3 block text-sm font-medium text-white/70">
            Select Agent
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: "auto", label: "Auto-Route", emoji: "🔀" },
              { value: "sales", label: "Sales", emoji: "💼" },
              { value: "support", label: "Support", emoji: "🔧" },
              { value: "service", label: "Service", emoji: "🎯" },
            ].map((agent) => (
              <button
                key={agent.value}
                onClick={() => setSelectedAgent(agent.value as AgentRole)}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  selectedAgent === agent.value
                    ? "border-indigo-500 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl">{agent.emoji}</div>
                <div className="mt-1 text-sm font-medium">{agent.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <label className="mb-3 block text-sm font-medium text-white/70">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question or request..."
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-white placeholder:text-white/30 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              rows={4}
              disabled={isLoading}
            />

            {/* Quick Examples */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-white/50">Quick examples:</span>
              {Object.entries(examples).map(([agent, example]) => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => {
                    setMessage(example);
                    setSelectedAgent(agent as AgentRole);
                  }}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="mt-4 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Send Message"}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Response</h3>
                <p className="text-sm text-white/60">
                  Agent: <span className="font-medium text-indigo-400">{response.agent}</span>
                  {" | "}
                  Confidence:{" "}
                  <span className="font-medium text-green-400">
                    {(response.response.confidence * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
              {response.safety && (
                <div
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    response.safety.recommendation === "allow"
                      ? "bg-green-500/20 text-green-400"
                      : response.safety.recommendation === "review"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {response.safety.recommendation.toUpperCase()}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="whitespace-pre-wrap text-white/90">
                {response.response.answer}
              </div>
            </div>

            {response.response.sources && response.response.sources.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-white/50">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {response.response.sources.map((source, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/60"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-4 text-center text-xs text-white/40">
          <p>
            This is a test interface for the Synqra multi-agent system. All agents are running in{" "}
            <strong>MOCK MODE</strong> by default (no API calls). Set AGENT_MODE=live in .env to
            enable real Claude API integration.
          </p>
        </div>
      </div>
    </main>
  );
}
