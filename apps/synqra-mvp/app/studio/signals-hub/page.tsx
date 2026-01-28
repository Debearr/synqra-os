"use client";


/**
 * Example: Scenario Hub list view
 * Uses global disclaimer from the studio shell
 */
export default function SignalsHubPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scenario Hub</h1>

      {/* Signals List */}
      <div className="space-y-4">
        <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
          <h2 className="text-lg font-medium mb-4">Recent Scenario Assessments</h2>
          <p className="text-sm text-noid-silver/70">
            Scenario list would be displayed here...
          </p>
        </div>
      </div>
    </div>
  );
}
