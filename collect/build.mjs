import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { collectWoot } from './woot.mjs';
import { collectWalmart } from './walmart.mjs';
import { collectEbay } from './ebay.mjs';
import { checkPictures } from './pictures.mjs';

const OUT = new URL('../docs/deals.json', import.meta.url);
const STATUS = new URL('../docs/status.json', import.meta.url);
const PICTURES = new URL('../docs/pictures.json', import.meta.url);
const KEEP_DAYS = { woot: 3, walmart: 10, ebay: 10 };
const MIN_TOTAL = 40;

const STORES = [
  { name: 'Amazon', url: 'https://www.amazon.com/deals' },
  { name: 'Walmart', url: 'https://www.walmart.com/shop/deals' },
  { name: 'eBay', url: 'https://www.ebay.com/globaldeals' },
  { name: 'Target', url: 'https://www.target.com/c/top-deals/-/N-4xw74' },
  { name: 'Best Buy', url: 'https://www.bestbuy.com/site/misc/deal-of-the-day/pcmcat248000050016.c?id=pcmcat248000050016' },
  { name: 'Costco', url: 'https://www.costco.com/hot-buys.html' },
  { name: 'Home Depot', url: 'https://www.homedepot.com/c/Savings_Center' },
  { name: 'Woot', url: 'https://www.woot.com/' },
];

const SOURCES = {
  woot: () => collectWoot({ key: process.env.WOOT_KEY }),
  walmart: (few) => collectWalmart({ n: few ? 15 : 100 }),
  ebay: (few) => collectEbay({ n: few ? 15 : 45 }),
};

const readPrevious = () => {
  try {
    const d = JSON.parse(readFileSync(OUT, 'utf8'));
    return Array.isArray(d.deals) ? d : { deals: [] };
  } catch {
    return { deals: [] };
  }
};
const previous = readPrevious();
const now = Date.now();
const fresh = (d) => now - Date.parse(d.fetched_at || 0) < (KEEP_DAYS[d.source] || 10) * 86400 * 1000;

const result = {}; const status = { ran_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), sources: {} };
for (const [name, run] of Object.entries(SOURCES)) {
  try {
    const cards = await run(Boolean(result.woot?.length));
    if (cards.length < 5) throw new Error(`only ${cards.length} cards`);
    result[name] = cards;
    status.sources[name] = { ok: true, cards: cards.length };
  } catch (e) {
    const kept = previous.deals.filter((d) => d.source === name && fresh(d));
    result[name] = kept;
    status.sources[name] = { ok: false, error: String(e.message || e).slice(0, 200), kept: kept.length };
    console.error(`${name}: ${e.message || e} (kept ${kept.length} earlier cards)`);
  }
}

let deals = Object.values(result).flat().filter((d) => !d.ends_at || Date.parse(d.ends_at) > now);
const readPassed = () => {
  try {
    const v = JSON.parse(readFileSync(PICTURES, 'utf8'));
    return Array.isArray(v.passed) ? v.passed : [];
  } catch {
    return [];
  }
};
const pictures = await checkPictures(deals, readPassed());
status.pictures = pictures.report;
deals.sort((a, b) => (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0) || b.pct - a.pct);
status.total = deals.length;

const stillGood = previous.deals.filter((d) => fresh(d) && (!d.ends_at || Date.parse(d.ends_at) > now)).length;
if (deals.length === 0 || (deals.length < MIN_TOTAL && deals.length < stillGood)) {
  status.published = false;
  console.error(`only ${deals.length} cards against ${stillGood} still valid; the previous file stays`);
} else {
  status.published = true;
  const payload = {
    updated_at: status.ran_at,
    deals,
    stores: STORES,
    attribution: {
      ...(deals.some((d) => d.source === 'woot') ? { woot: 'Offers from Woot, an Amazon company' } : {}),
      ...(deals.some((d) => d.image_url && d.source !== 'woot') ? { pictures: 'Product pictures come from each store’s own listing' } : {}),
    },
  };
  mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload));
  writeFileSync(PICTURES, JSON.stringify({ passed: pictures.passed }));
}
writeFileSync(STATUS, JSON.stringify(status, null, 1) + '\n');
console.log(JSON.stringify(status));
