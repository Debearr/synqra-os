import { speak } from "../../../apps/noid-core/voice/voiceController.js";

export default async function handler(req, res) {
  try {
    const file = await speak("Hey NØID, check earnings!");
    res.status(200).json({ ok: true, file });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
