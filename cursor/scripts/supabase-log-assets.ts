// 🧠 SUPABASE ASSET LOGGER v1.0
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { mirrorToSheets } from "./sheets-mirror-log";
import { generateThumbnail } from "./generate-thumbnails";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WATCH_DIRS = [
  path.resolve("./assets/static"),
  path.resolve("./assets/motion"),
];

function ensureDirectoriesExist(dirs: string[]) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

ensureDirectoriesExist(WATCH_DIRS);

const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg", ".mp4", ".mov"];

async function logAsset(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return;

    const fileName = path.basename(filePath);
    const folderName = filePath.includes(`${path.sep}motion${path.sep}`) || filePath.endsWith(`${path.sep}motion`) ? "motion" : "static";

    const isValid = VALID_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
    if (!isValid) {
      console.log(`❌ Skipped invalid file: ${fileName}`);
      return;
    }

    const data = {
      file_name: fileName,
      folder_type: folderName,
      file_size_kb: (stats.size / 1024).toFixed(2),
      created_at: new Date().toISOString(),
      validation_status: "✅ Passed",
    } as const;

    const { error } = await supabase.from("asset_logs").insert([data]);
    if (error) {
      console.error("❌ Supabase insert failed:", error);
    } else {
      console.log(`✅ Logged asset: ${fileName} (${folderName})`);
      await mirrorToSheets(data as any);
      await generateThumbnail(filePath);
    }
  } catch (err) {
    console.error("⚠️ logAsset error:", err);
  }
}

for (const dir of WATCH_DIRS) {
  try {
    fs.watch(dir, (eventType, filename) => {
      if (!filename) return;
      if (eventType !== "rename") return;

      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        void logAsset(fullPath);
      }
    });
  } catch (err) {
    console.error(`❌ Failed to watch ${dir}:`, err);
  }
}

console.log("👀 Watching /assets/static and /assets/motion for new files...");
