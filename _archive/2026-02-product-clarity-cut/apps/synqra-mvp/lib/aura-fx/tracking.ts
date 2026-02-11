import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

type SignalStatus =
  | "open"
  | "tp1"
  | "tp2"
  | "tp3"
  | "closed"
  | "stopped"
  | "UNRESOLVED"
  | "PARTIAL_RESOLUTION_1"
  | "PARTIAL_RESOLUTION_2"
  | "PARTIAL_RESOLUTION_3"
  | "RESOLVED_AS_ASSESSED"
  | "RESOLVED_CONTRARY";

export interface AuraSignalInput {
  pair: string;
  style: string;
  direction: string;
  entry: string;
  stop: string;
  tp1?: string;
  tp2?: string;
  tp3?: string;
  reason?: string;
  notes?: string;
}

export async function logSignal(data: AuraSignalInput): Promise<string> {
  const supabase = requireSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("aura_signals")
    .insert({
      pair: data.pair,
      style: data.style,
      direction: data.direction,
      entry: data.entry,
      stop: data.stop,
      tp1: data.tp1 ?? null,
      tp2: data.tp2 ?? null,
      tp3: data.tp3 ?? null,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to log signal: ${error.message}`);
  }

  const signalId = inserted.id as string;

  const { error: historyError } = await supabase
    .from("aura_signal_history")
    .insert({
      signal_id: signalId,
      status: "open",
      note: data.reason ?? null,
    });

  if (historyError) {
    throw new Error(`Failed to log signal history: ${historyError.message}`);
  }

  return signalId;
}

export async function updateSignal(
  id: string,
  status: SignalStatus,
  note?: string
): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const client = supabase;

  const { error } = await client.from("aura_signals").update({
    status,
    notes: note ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (!error) {
    const historyError = await client
      .from("aura_signal_history")
      .insert({
        signal_id: id,
        status,
        note: note ?? null,
      }).then((res) => res.error);
    if (historyError) {
      throw new Error(`Failed to log history: ${historyError.message}`);
    }
  }

  if (error) {
    throw new Error(`Failed to update signal: ${error.message}`);
  }
}
