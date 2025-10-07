import fs from "fs";
import path from "path";
import textToSpeech from "@google-cloud/text-to-speech";
import OpenAI from "openai";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateOutputPath(baseDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(baseDir, `speech-${timestamp}.mp3`);
}

export async function speak(text) {
  const outDir = path.join(process.cwd(), "public/voice");
  ensureDir(outDir);
  const outPath = generateOutputPath(outDir);

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGoogle = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (hasOpenAI) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const voice = process.env.OPENAI_TTS_VOICE || "alloy";
    const result = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text
    });
    const buffer = Buffer.from(await result.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    return outPath;
  }

  if (hasGoogle) {
    const ttsClient = new textToSpeech.TextToSpeechClient();
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" }
    });
    fs.writeFileSync(outPath, response.audioContent, "binary");
    return outPath;
  }

  throw new Error(
    "Missing TTS credentials. Set OPENAI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS."
  );
}
