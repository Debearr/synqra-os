import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath ?? "");

export async function normalizeToWav(input: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `${randomUUID()}.input`);
  const outputPath = join(tmpdir(), `${randomUUID()}.wav`);
  await fs.writeFile(inputPath, input);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .format("wav")
      .audioFrequency(48000)
      .audioChannels(2)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });

  const wav = await fs.readFile(outputPath);
  await fs.unlink(inputPath).catch(() => {});
  await fs.unlink(outputPath).catch(() => {});
  return wav;
}
