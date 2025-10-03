export async function enqueueOne(): Promise<void> {
  console.log("[scripts] Enqueue one job (placeholder)");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  enqueueOne().catch((err) => {
    console.error("[scripts] Error:", err);
    process.exit(1);
  });
}

