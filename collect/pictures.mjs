import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UA, allowed } from './lib.mjs';

const run = promisify(execFile);
const PROMO = /\d{1,2}\s?%\s?off\b|coupon|promo|\bcode\b|\bsave\s?\$\s?\d/i;

const large = (u) => (u.includes('i.ebayimg.com') ? u.replace(/\/s-l\d+\./, '/s-l500.') : u.split('?')[0] + '?odnHeight=500&odnWidth=500&odnBg=FFFFFF');

async function reader() {
  try { await run('tesseract', ['--version'], { timeout: 10000 }); return true; } catch { return false; }
}

/**
 * Keeps a picture only when the words printed inside it were read and carry no coupon, promo code or "% off" banner.
 * `verified` holds the picture addresses that passed in earlier runs. Without the reader, only those keep their picture.
 */
export async function checkPictures(cards, verified) {
  const known = new Set(verified);
  const canRead = await reader();
  const dir = canRead ? await mkdtemp(join(tmpdir(), 'pictures-')) : null;
  const report = { reader: canRead, read: 0, kept: 0, dropped: 0 };
  const passed = [];
  for (const d of cards) {
    if (!d.image_url) continue;
    if (known.has(d.image_url)) { passed.push(d.image_url); report.kept++; continue; }
    let clean = false;
    if (canRead) {
      try {
        const url = large(d.image_url);
        if (!(await allowed(url))) throw new Error('robots');
        const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error(String(r.status));
        const file = join(dir, d.id);
        await writeFile(file, Buffer.from(await r.arrayBuffer()));
        const { stdout } = await run('tesseract', [file, 'stdout', '--psm', '11'], { timeout: 30000 });
        report.read++;
        clean = !PROMO.test(stdout);
      } catch { clean = false; }
    }
    if (clean) { passed.push(d.image_url); report.kept++; } else { delete d.image_url; report.dropped++; }
  }
  if (dir) await rm(dir, { recursive: true, force: true });
  return { report, passed };
}
