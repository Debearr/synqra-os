// 🧠 SUPABASE LOGGING + VALIDATION v1.0
import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dayjs from "dayjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const watchDirs = ["./assets/static", "./assets/motion"];

function checksum(filePath: string) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function logToSupabase(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const type = filePath.includes("/motion/") ? "motion" : "static";
  const file = path.basename(filePath);
  const hash = checksum(filePath);
  const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);
  const createdAt = dayjs().format("YYYY-MM-DD HH:mm:ss");

  // basic validation rules
  let validation = "✅ OK";
  if (sizeKB === "0.00") validation = "❌ Empty";
  if (ext !== ".png" && ext !== ".jpg" && ext !== ".mp4") validation = "⚠️ Unsupported";

  const payload = {
    file_name: file,
    file_type: type,
    size_kb: Number(sizeKB),
    checksum: hash,
    created_at: createdAt,
    validation_status: validation,
    version_tag: "v3.1",
  };

  await supabase.from("asset_logs").insert([payload]);
  console.log(`📦 Logged → ${file} | ${validation}`);
}

watchDirs.forEach(dir => {
  chokidar.watch(dir, { ignoreInitial: true }).on("add", file => logToSupabase(file));
});
