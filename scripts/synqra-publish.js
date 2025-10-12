import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const ROOT = process.cwd();
const APPROVED_DIR = path.join(ROOT, 'posts', 'approved');
const PUBLISHED_DIR = path.join(ROOT, 'posts', 'published');
const LOG_DIR = path.join(ROOT, 'logs', 'scheduler');
const LOG_FILE = path.join(LOG_DIR, 'run_log.txt');
const isMock = String(process.env.MOCK || '').toLowerCase() === '1' || String(process.env.MOCK || '').toLowerCase() === 'true';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(APPROVED_DIR)) fs.mkdirSync(APPROVED_DIR, { recursive: true });

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const POST_AS = (process.env.POST_AS || 'person').toLowerCase();
const PERSON_URN = process.env.LINKEDIN_PERSON_URN;
const ORG_URN = process.env.LINKEDIN_ORG_URN;
const ACTOR_URN = POST_AS === 'organization' ? ORG_URN : PERSON_URN;

function ensureRealEnv() {
  if (isMock) return;
  if (!ACCESS_TOKEN) {
    throw new Error('Missing LINKEDIN_ACCESS_TOKEN');
  }
  if (POST_AS === 'person' && !PERSON_URN) {
    throw new Error('Missing LINKEDIN_PERSON_URN');
  }
  if (POST_AS === 'organization' && !ORG_URN) {
    throw new Error('Missing LINKEDIN_ORG_URN');
  }
}

function log(line) {
  const stamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${stamp}] ${line}\n`);
  console.log(line);
}

function readBundleDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => {
    const full = path.join(dir, f);
    return fs.lstatSync(full).isDirectory();
  });
}

function findAssetFile(bundlePath) {
  const files = fs.readdirSync(bundlePath);
  const img = files.find((f) => /\.(jpg|jpeg|png)$/i.test(f));
  const vid = files.find((f) => /\.(mp4|mov|webm)$/i.test(f));
  return img ? { type: 'image', file: img } : (vid ? { type: 'video', file: vid } : null);
}

async function registerUploadImage() {
  const res = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: ACTOR_URN,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
      }
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Register upload failed: ${res.status} ${JSON.stringify(data)}`);
  }
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;
  return { uploadUrl, asset };
}

async function uploadImageToLinkedIn(uploadUrl, imageBuffer, mime) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mime, 'Content-Length': imageBuffer.length },
    body: imageBuffer
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Image upload failed: ${res.status} ${t}`);
  }
}

async function createUGCPost({ actorUrn, text, assetUrn, visibility = 'PUBLIC' }) {
  const payload = {
    author: actorUrn,
    commentary: text,
    visibility,
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            description: { text: '' },
            media: assetUrn,
            title: { text: '' }
          }
        ]
      }
    }
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Create post failed: ${res.status} ${t}`);
  }
  return await res.json();
}

async function publishBundle(bundleName) {
  const bundlePath = path.join(APPROVED_DIR, bundleName);

  const captionPath = path.join(bundlePath, 'caption.txt');
  if (!fs.existsSync(captionPath)) {
    throw new Error(`Missing caption.txt in ${bundleName}`);
  }
  const caption = fs.readFileSync(captionPath, 'utf8').trim();
  if (!caption || /^\s*$/.test(caption)) {
    throw new Error(`Empty caption in ${bundleName}`);
  }

  const metaPath = path.join(bundlePath, 'meta.json');
  let visibility = 'PUBLIC';
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.visibility && ['PUBLIC', 'CONNECTIONS'].includes(meta.visibility)) {
        visibility = meta.visibility;
      }
    } catch {}
  }

  const asset = findAssetFile(bundlePath);
  if (!asset) throw new Error(`No image/video found in ${bundleName}`);

  if (asset.type === 'video') {
    log(`⏭️ Queued video bundle for chunked upload: ${bundleName}`);
    return { queuedVideo: true };
  }

  const assetPath = path.join(bundlePath, asset.file);
  const mime = /\.png$/i.test(asset.file) ? 'image/png' : 'image/jpeg';

  if (isMock) {
    fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
    fs.renameSync(bundlePath, path.join(PUBLISHED_DIR, bundleName));
    log(`✅ (MOCK) Published: ${bundleName}`);
    return { ok: true, mock: true };
  }

  ensureRealEnv();
  const imageBuffer = fs.readFileSync(assetPath);
  const { uploadUrl, asset: assetUrn } = await registerUploadImage();
  await uploadImageToLinkedIn(uploadUrl, imageBuffer, mime);
  const result = await createUGCPost({ actorUrn: ACTOR_URN, text: caption, assetUrn, visibility });

  fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
  fs.renameSync(bundlePath, path.join(PUBLISHED_DIR, bundleName));
  log(`✅ Published: ${bundleName} → ${result?.id || 'ugcPosts OK'}`);
  return { ok: true };
}

async function main() {
  const bundles = readBundleDirs(APPROVED_DIR);
  if (bundles.length === 0) {
    log('ℹ️ No approved bundles to publish.');
    return;
  }

  for (const b of bundles) {
    try {
      await publishBundle(b);
    } catch (err) {
      log(`❌ Failed ${b}: ${err.message}`);
    }
  }
}

main().catch((e) => {
  log(`❌ Fatal: ${e.message}`);
  process.exit(1);
});
