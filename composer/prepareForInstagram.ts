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

