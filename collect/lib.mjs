import { createHash } from 'node:crypto';

export const UA = 'deals-content/1.0 (content refresh for a shopping app; contact via the repository)';

export const CATS = [
  ['Tech', ['laptop', ' tv', 'television', 'headphone', 'earbud', 'airpods', 'phone', 'tablet', 'monitor', 'camera', 'speaker', 'router', 'ssd', 'gaming', 'charger', 'power bank', 'batteries', 'battery', 'usb', 'bluetooth', 'keyboard', 'mouse', 'smart', 'fire tv', 'graphics card', 'rtx', 'ryzen', 'intel', 'desktop', 'mini pc', 'gaming pc', 'nvme', 'motherboard', 'ram ', 'ddr', 'watch', 'xbox', 'playstation', 'nintendo', 'projector', 'soundbar', 'printer', 'webcam', 'drone', 'earphone', 'apple', 'samsung', 'lenovo', 'dell', 'hp ', 'asus', 'acer', 'macbook', 'ipad', 'chromebook', 'hard drive', 'storage drive', 'micro sd', 'memory card']],
  ['Kitchen', ['air fryer', 'blender', 'coffee', 'espresso', 'knife', 'cookware', 'pan', 'mixer', 'toaster', 'kettle', 'slow cooker', 'crock', 'grill', 'cup', 'bottle', 'tumbler', 'food', 'kitchen', 'cutlery', 'mug', 'cooker', 'oven', 'microwave', 'dishwasher', 'refrigerator', 'fridge', 'freezer']],
  ['Home', ['vacuum', 'robot', 'mattress', 'pillow', 'sheet', 'lamp', 'fan ', 'heater', 'purifier', 'humidifier', 'towel', 'blanket', 'rug', 'storage', 'cleaning', 'cloth', 'candle', 'furniture', 'chair', 'desk', 'bedding', 'curtain', 'light bulb', 'led bulb', 'organizer', 'laundry', 'bath', 'sofa', 'table', 'shelf', 'washer', 'dryer', 'thermostat', 'doorbell', 'security camera']],
  ['Tools', ['drill', 'saw', 'tool', 'wrench', 'ladder', 'compressor', 'sander', 'grinder', 'flashlight', 'tape', 'screwdriver', 'socket', 'garage', 'pressure washer', 'generator', 'lawn', 'mower', 'trimmer', 'blower']],
  ['Toys', ['lego', 'toy', 'doll', 'puzzle', 'board game', 'nerf', 'plush', 'kids', 'play set', 'playset', 'funko', 'figure', 'magnetic tiles', 'blaster', 'ride-on', 'ride on']],
  ['Beauty', ['hair', 'skin', 'serum', 'shaver', 'makeup', 'razor', 'lotion', 'shampoo', 'toothbrush', 'oral-b', 'electric brush', 'perfume', 'fragrance', 'cologne']],
  ['Fashion', ['shoe', 'sneaker', 'boot', 'jacket', 'jeans', 'dress', 'hoodie', 'coat', 'shirt', 'loafer', 'sock', 'women', "men's", 'mens', 'womens', 'sandal', 'nike', 'adidas', 'sunglasses', 'handbag', 'wallet', 'backpack', 'ring', 'necklace', 'earring', 'diamond', 'bracelet', 'sweater', 'pants', 'legging', 'apparel', 'shorts', 'polo', 'cap', 'hat', 'jogger', 'slipper', 'skirt', 'blouse', 'puma', 'asics', 'reebok', 'new balance', 'under armour']],
  ['Baby', ['stroller', 'car seat', 'crib', 'diaper', 'baby', 'infant', 'toddler']],
  ['Pets', ['dog', 'cat ', 'pet ', 'litter', 'puppy', 'kitten']],
  ['Sports', ['bike', 'treadmill', 'dumbbell', 'yoga', 'tent', 'running', 'golf', 'fitness', 'outdoor', 'camping', 'hiking', 'fishing', 'basketball', 'soccer', 'scooter', 'e-bike', 'ebike', 'kayak', 'exercise']],
];

const BAD = /vape|tobacco|cigar|nicotine|cbd|adult|lingerie|erotic|nsfw|sexy|sex toy|ammo|firearm|airsoft|wine|liquor|beer|gift card|e-gift|dental|google play|play store|subscription|membership|warranty plan|protection plan|promo code|coupon code|use code|refurb|certified refur|\(certified|renewed|pre-owned|preowned|open box|open-box|\bused\b|- (?:good|very good|excellent|fair|acceptable)\b|\bgrade [a-c]\b|for parts|hearing aid|\btester\b|(?:good|excellent|fair|acceptable) condition|\bgood\s*$/i;
// Watches and jewelry are sold against inflated list prices almost everywhere; a "94% off" card is not a real price drop.
const INFLATED = /\bwatch(?:es)?\b|\bdiamond|\bcarat|\b\d+(?:\.\d+)?\s?ct\b|\bring\b|\bnecklace|\bbracelet|\bearring|\bpendant|\bjewel|\bgemstone|\bsapphire|\bemerald|\bmoissanite|\bsilver\b.*\bchain|\bgold\b.*\bchain|cologne|perfume|parfum|fragrance|eau de|\bed[tp]\b|toilette|body mist|\boz\b.*\b(?:silver|gold)\b|\b(?:silver|gold)\b.*\boz\b|\.999|bullion|\bcoins?\b/i;
const MAX_PCT = 80;
const MAX_PRICE = 1500;
const MIN_SAVING = 10;
const SHOUT = (t) => { const l = [...t].filter((c) => /[a-z]/i.test(c)); return l.length > 12 && l.filter((c) => c === c.toUpperCase()).length / l.length > 0.6; };

const WORD = (w) => {
  const k = w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?:^|[^a-z])' + k + (w.trim().length <= 4 ? '(?:e?s)?(?![a-z])' : ''), 'i');
};
const ORDER = ['Toys', 'Sports', 'Pets', 'Baby', 'Tech', 'Kitchen', 'Tools', 'Home', 'Beauty', 'Fashion'];
const CAT_RE = [...CATS].sort((x, y) => ORDER.indexOf(x[0]) - ORDER.indexOf(y[0])).map(([c, words]) => [c, words.map(WORD)]);

export function category(title, fallback = 'Other') {
  for (const [c, res] of CAT_RE) if (res.some((r) => r.test(title))) return c;
  return fallback;
}

export function money(s) {
  const m = /\$\s?([\d,]+(?:\.\d{1,2})?)/.exec(s || '');
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

export function mkid(store, url) {
  return createHash('sha1').update(`${store}|${url}`).digest('hex').slice(0, 12);
}

export function clean(title) {
  return title.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

/** One card, or null when the product should not be listed. Prices are numbers; `old` is the store's own previous or list price. */
export function deal(store, source, title, url, price, old, extra = {}) {
  title = clean(title);
  if (!title || title.length < 8 || BAD.test(title) || INFLATED.test(title) || SHOUT(title) || !(price > 0) || price > MAX_PRICE) return null;
  if (!(old > price) || old - price < MIN_SAVING) return null;
  const pct = Math.round((1 - price / old) * 100);
  if (pct > MAX_PCT) return null;
  const out = {
    id: mkid(store, url), store, title, url, price, old_price: old, pct,
    category: extra.category || category(title),
    source, fetched_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  };
  if (extra.coupon) out.coupon = extra.coupon;
  if (extra.ends_at) out.ends_at = extra.ends_at;
  if (extra.image_url) out.image_url = extra.image_url;
  return out;
}

const robotsCache = new Map();
/** True when the site's robots.txt lets a client like ours read the path (checked for our name and for every client). */
export async function allowed(url) {
  const u = new URL(url);
  const origin = u.origin;
  if (!robotsCache.has(origin)) {
    let rules = [];
    try {
      const txt = await (await fetch(origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })).text();
      let applies = false;
      for (const raw of txt.split('\n')) {
        const line = raw.split('#')[0].trim();
        const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
        if (!m) continue;
        const [, key, value] = m;
        if (key.toLowerCase() === 'user-agent') applies = value.trim() === '*' || UA.toLowerCase().startsWith(value.trim().toLowerCase());
        else if (applies && key.toLowerCase() === 'disallow' && value.trim()) rules.push(value.trim());
      }
    } catch { rules = []; }
    robotsCache.set(origin, rules);
  }
  const path = u.pathname + u.search;
  return !robotsCache.get(origin).some((r) => path.startsWith(r.replace(/\*$/, '')));
}

export async function text(url, extraHeaders = {}) {
  if (!(await allowed(url))) throw new Error(`robots.txt disallows ${url}`);
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...extraHeaders }, signal: AbortSignal.timeout(45000), redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.text();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Top `n` by discount with at most `perCat` per category, one entry per product title. */
export function pick(cards, n, perCat = 6) {
  const seen = new Set(); const per = new Map(); const out = [];
  for (const d of [...cards].sort((a, b) => b.pct - a.pct)) {
    const key = d.title.toLowerCase().replace(/\((?:size|sz)\s*[^)]*\)|\b(?:size|sz)\s*\d+(?:\.\d)?\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
    const head = key.slice(0, 44);
    if (seen.has(key) || seen.has(d.id) || seen.has('h:' + head)) continue;
    if ((per.get(d.category) || 0) >= perCat) continue;
    seen.add(key); seen.add(d.id); seen.add('h:' + head); per.set(d.category, (per.get(d.category) || 0) + 1);
    out.push(d);
    if (out.length >= n) break;
  }
  return out;
}
