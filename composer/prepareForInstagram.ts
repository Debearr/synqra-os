import sharp from "sharp";

export async function prepareForInstagram(input: Buffer): Promise<Buffer> {
  if (!Buffer.isBuffer(input)) throw new TypeError("Input must be a Buffer");

  // Instagram portrait feed post max is 1080x1350. Use inside fit to preserve aspect.
  // Re-encode as high-quality JPEG with chroma subsampling disabled for sharper text.
  const output = await sharp(input)
    .rotate() // use EXIF orientation
    .resize({ width: 1080, height: 1350, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  console.log(`Image recompressed: original ${input.length}, final ${output.length}`);
  return output;
}

// Simple CLI to process all images in a directory
// Usage: node dist/composer/prepareForInstagram.js [inputDir] [outputDir]
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import("fs/promises");
  const path = await import("path");
  const inputDir = process.argv[2] || "assets/input";
  const outputDir = process.argv[3] || "assets/output";

  (async () => {
    await fs.mkdir(outputDir, { recursive: true });
    const entries = await fs.readdir(inputDir, { withFileTypes: true });
    const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"]);
    const files = entries.filter(e => e.isFile()).map(e => e.name).filter(name => allowed.has(path.extname(name).toLowerCase()));

    for (const name of files) {
      const srcPath = path.join(inputDir, name);
      const dstName = path.parse(name).name + ".jpg";
      const dstPath = path.join(outputDir, dstName);
      const buf = await fs.readFile(srcPath);
      const out = await prepareForInstagram(buf);
      await fs.writeFile(dstPath, out);
      console.log(`[composer] Wrote ${dstPath}`);
    }

    if (files.length === 0) {
      console.log(`[composer] No images found in ${inputDir}`);
    }
  })().catch(err => {
    console.error("[composer] Error:", err);
    process.exit(1);
  });
}
