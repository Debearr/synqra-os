import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.md')) files.push(path.join(dir, e.name));
  }
  return files;
}

function findPendingPosts() {
  const draftsDir = 'synqra-drafts';
  const postsDir = 'posts';
  const draftFiles = listMarkdown(draftsDir);
  const postFiles = listMarkdown(postsDir);

  const parseMeta = (file) => {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const { data } = matter(raw);
      return data || {};
    } catch (e) {
      return {};
    }
  };

  const pending = [];
  for (const file of [...draftFiles, ...postFiles]) {
    const meta = parseMeta(file);
    const scheduled = Boolean(meta.scheduledAt || meta.publishedAt);
    if (!scheduled) pending.push({ file, meta });
  }
  return pending;
}

function main() {
  const pending = findPendingPosts();
  fs.writeFileSync('pending-posts.json', JSON.stringify(pending, null, 2));
  console.log(`✅ Found ${pending.length} pending post(s). Wrote pending-posts.json`);
}

main();
