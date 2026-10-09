import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredPages = ['index.html', 'login.html', 'register.html', 'application-status.html', 'auth-callback.html', 'set-password.html', 'dashboard.html', 'hazmat-awareness.html', 'hazmat-course.html'];
const errors = [];
let checkedReferences = 0;

async function exists(relativePath) {
  try { await access(path.join(root, relativePath), constants.F_OK); return true; } catch { return false; }
}

for (const page of requiredPages) {
  if (!await exists(page)) { errors.push(`Missing required page: ${page}`); continue; }
  const html = await readFile(path.join(root, page), 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${page} is missing a title.`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) errors.push(`${page} is missing the viewport meta tag.`);
  const references = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(reference)) continue;
    const clean = decodeURIComponent(reference.split(/[?#]/)[0]).replace(/^\//, '');
    if (!clean) continue;
    checkedReferences += 1;
    if (!await exists(clean)) errors.push(`${page} references missing file: ${clean}`);
  }
}

const migrationDirectory = path.join(root, 'supabase', 'migrations');
const migrations = (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();
if (migrations.length < 3) errors.push('Expected all three LMS database migrations.');

const clientFiles = ['assets/js/supabase-client.js', 'assets/js/auth.js', 'assets/js/dashboard.js', 'assets/js/course-sync.js'];
for (const file of clientFiles) {
  const source = await readFile(path.join(root, file), 'utf8');
  if (/SUPABASE_(?:SECRET|SERVICE_ROLE)/.test(source)) errors.push(`${file} must not reference a server secret.`);
}

if (errors.length) {
  console.error(`Site check failed with ${errors.length} problem(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Site check passed: ${requiredPages.length} pages, ${checkedReferences} local references, ${migrations.length} migrations.`);
}
