import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath ?? "");

export async function stitchVideoWithAudio(video: Buffer, audio: Buffer): Promise<Buffer> {
  const inputVideo = join(tmpdir(), `${randomUUID()}.mp4`);
  const inputAudio = join(tmpdir(), `${randomUUID()}.wav`);
  const output = join(tmpdir(), `${randomUUID()}.mp4`);
  await fs.writeFile(inputVideo, video);
  await fs.writeFile(inputAudio, audio);

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .addInput(inputVideo)
      .addInput(inputAudio)
      .outputOptions(["-c:v copy", "-c:a aac", "-shortest"])
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(output);
  });

  const stitched = await fs.readFile(output);
  await fs.unlink(inputVideo).catch(() => {});
  await fs.unlink(inputAudio).catch(() => {});
  await fs.unlink(output).catch(() => {});
  return stitched;
}
