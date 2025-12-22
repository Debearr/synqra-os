import crypto from "crypto";
import sharp from "sharp";
import { normalizeToWav } from "../ffmpeg/audio";

export async function sanitizeAvatarImage(
  imageBase64: string
): Promise<{ optimized: Buffer; dataUrl: string; perceptualHash: string }> {
  const cleaned = imageBase64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  const optimized = await sharp(buffer).resize({ width: 720, withoutEnlargement: true }).png({ quality: 82 }).toBuffer();
  const dataUrl = `data:image/png;base64,${optimized.toString("base64")}`;
  const perceptualHash = crypto.createHash("sha1").update(optimized).digest("hex");
  return { optimized, dataUrl, perceptualHash };
}

export async function sanitizeAvatarAudio(audioBase64: string): Promise<{ wav: Buffer; dataUrl: string }> {
  const cleaned = audioBase64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  const wav = await normalizeToWav(buffer);
  const dataUrl = `data:audio/wav;base64,${wav.toString("base64")}`;
  return { wav, dataUrl };
}
