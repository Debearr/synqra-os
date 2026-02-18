#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3000";

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("Failed to launch Next.js:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
