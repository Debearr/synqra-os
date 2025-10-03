export async function runWorker(): Promise<void> {
  console.log("[worker] Placeholder. In production use: n8n worker --concurrency=10");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorker().catch((err) => {
    console.error("[worker] Error:", err);
    process.exit(1);
  });
}

