export async function runEnqueue(): Promise<void> {
  console.log("[orchestrator] Enqueue job (placeholder)");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEnqueue().catch((err) => {
    console.error("[orchestrator] Error:", err);
    process.exit(1);
  });
}

