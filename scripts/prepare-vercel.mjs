import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await stat(path.join(output, 'index.html'));

// Use the deployment's origin in canonical URLs and sharing images.
// SITE_URL optionally selects the final custom domain.
const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const origin = configured ? new URL(configured.includes('://') ? configured : `https://${configured}`).origin : null;
if (origin && !origin.startsWith('https://')) throw new Error('SITE_URL must use HTTPS.');
let pages = 0;
async function prepare(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await prepare(file);
    else if (entry.name.endsWith('.html')) {
      pages++;
      if (origin) {
        const html = await readFile(file, 'utf8');
        await writeFile(file, html.replaceAll('https://d-andrea.vercel.app', origin));
      }
    }
  }
}
await prepare(output);
console.log(`Vercel: ${pages} static pages ready in dist${origin ? ` for ${origin}` : ''}.`);
