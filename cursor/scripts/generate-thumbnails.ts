// 🧠 THUMBNAIL + METADATA EMBEDDER v1.0
import "dotenv/config";
import sharp from "sharp";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { mirrorToSheets } from "./sheets-mirror-log";
import ffmpegPathImport from "ffmpeg-static";
import ffprobeImport from "ffprobe-static";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Resolve static binary paths (fallback to system if not available)
const ffmpegPath = (ffmpegPathImport as unknown as string) || "ffmpeg";
const ffprobePath = (ffprobeImport as { path?: string } | undefined)?.path || "ffprobe";

export async function generateThumbnail(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const thumbDir = path.resolve("./assets/thumbnails");
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
  const thumbPath = path.join(thumbDir, `${baseName}.jpg`);

  let width = 0;
  let height = 0;

  try {
    if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      const meta = await sharp(filePath).metadata();
      width = meta.width || 0;
      height = meta.height || 0;
      await sharp(filePath)
        .resize({ width: 100 })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
    } else if ([".mp4", ".mov"].includes(ext)) {
      execSync(`"${ffmpegPath}" -y -i "${filePath}" -vframes 1 -vf scale=100:-1 "${thumbPath}"`);
      const dim = execSync(
        `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${filePath}"`
      )
        .toString()
        .trim();
      const [w, h] = dim.split("x").map(Number);
      width = w;
      height = h;
    } else {
      console.log(`ℹ️ Unsupported extension for thumbnail: ${ext}`);
      return;
    }

    const aspect = height ? (width / height).toFixed(2) : "N/A";
    const metaData = {
      file_name: path.basename(filePath),
      thumbnail_path: thumbPath,
      width,
      height,
      aspect_ratio: aspect,
    } as const;

    await supabase.from("asset_logs").update(metaData).eq("file_name", metaData.file_name);

    await mirrorToSheets({ ...metaData, validation_status: "Thumbnail OK" });

    console.log(`🖼️ Thumbnail + metadata added: ${metaData.file_name}`);
  } catch (err) {
    console.error("❌ Thumbnail generation failed:", err);
  }
}
