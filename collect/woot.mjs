import { deal, category, pick, sleep, UA } from './lib.mjs';

const SITE_CAT = { Electronics: 'Tech', Computers: 'Tech', Tools: 'Tools', Home: 'Home', Sports: 'Sports', Kids: 'Toys', Shirts: 'Fashion', Accessories: 'Fashion', Gourmet: 'Kitchen', Clearance: 'Other', Main: 'Other', Featured: 'Other', Wootoff: 'Other' };
const price = (p) => (Array.isArray(p) ? p[0]?.Minimum : p?.Minimum) ?? null;

/** Woot's official feed: new-condition offers with a list price, at least `minPct` off, not sold out, at least 12 hours left. */
export async function collectWoot({ key, minPct = 25, n = 60, maxPages = 60 }) {
  if (!key) throw new Error('WOOT_KEY is not set');
  const headers = { 'x-api-key': key, Accept: 'application/json', 'User-Agent': UA };
  const cards = [];
  const horizon = Date.now() + 12 * 3600 * 1000;
  let pages = 1;
  for (let page = 1; page <= pages && page <= maxPages; page++) {
    const r = await fetch(`https://developer.woot.com/feed/All?page=${page}`, { headers, signal: AbortSignal.timeout(30000) });
    if (r.status === 404 && page > 1) break;
    if (!r.ok) throw new Error(`Woot feed page ${page}: ${r.status} ${r.headers.get('x-amzn-errortype') || ''} ${(await r.text()).slice(0, 80)}`.trim());
    const body = await r.json();
    pages = body.TotalPages || 1;
    if (!(body.Items || []).length) break;
    for (const it of body.Items || []) {
      const cond = (it.Condition || 'New').toLowerCase();
      if (it.IsSoldOut || it.IsAvailableOnMobileAppOnly || !it.Photo || !it.Url) continue;
      if (!cond.startsWith('new')) continue;
      const sale = price(it.SalePrice), list = price(it.ListPrice);
      if (!sale || !list || list <= sale) continue;
      if (it.EndDate && Date.parse(it.EndDate) < horizon) continue;
      const d = deal('Woot', 'woot', it.Title, it.Url.split('?')[0], sale, list, {
        category: category(it.Title, SITE_CAT[it.Site] || 'Other'),
        ends_at: it.EndDate || undefined,
        image_url: it.Photo,
      });
      if (d && d.pct >= minPct) cards.push(d);
    }
    await sleep(1100);
  }
  return pick(cards, n, 10);
}
