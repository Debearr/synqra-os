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

import sharp from "sharp";

export async function prepareForInstagram(input: Buffer): Promise<Buffer> {
  if (!Buffer.isBuffer(input)) throw new TypeError("Input must be a Buffer");

  const output = await sharp(input)
    .resize({ width: 1080, height: 1350, fit: "inside" })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log(`Image recompressed: original ${input.length}, final ${output.length}`);
  return output;
}

