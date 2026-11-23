import { deal, money, pick, sleep, text } from './lib.mjs';

const PAGES = [
  ['/shop/deals/electronics', 'Tech'], ['/shop/deals/video-games', 'Tech'], ['/shop/deals/home', 'Home'], ['/shop/deals/toys', 'Toys'],
  ['/shop/deals/fashion', 'Fashion'], ['/shop/deals/baby', 'Baby'], ['/shop/deals/pets', 'Pets'],
  ['/shop/deals/sports-and-outdoors', 'Sports'], ['/shop/deals/patio-and-garden', 'Home'], ['/shop/deals/home-improvement', 'Tools'],
  ['/shop/deals', null], ['/shop/deals/flash-deals', null], ['/shop/deals/clearance', null],
];

function walk(o, out) {
  if (Array.isArray(o)) for (const v of o) walk(v, out);
  else if (o && typeof o === 'object') {
    if (o.usItemId && o.priceInfo && o.name) out.push(o);
    else for (const v of Object.values(o)) walk(v, out);
  }
}

/** Walmart's public deal pages: products with a previous price, in stock, not sponsored, with enough reviews and the product's own picture. */
export async function collectWalmart({ minPct = 25, n = 15 }) {
  const cards = [];
  for (const [path, pageCat] of PAGES) {
    const items = [];
    try {
      const html = await text('https://www.walmart.com' + path);
      const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
      if (m) walk(JSON.parse(m[1]), items);
    } catch (e) {
      console.error(`walmart ${path}: ${e.message || e}`);
    }
    for (const it of items) {
      const price = money(it.priceInfo.linePrice || it.priceInfo.currentPrice), old = money(it.priceInfo.wasPrice);
      if (!price || !old || it.isSponsoredFlag || it.isOutOfStock || (it.availabilityStatus && it.availabilityStatus !== 'IN_STOCK')) continue;
      if ((it.numberOfReviews || 0) < 100 || (it.averageRating || 0) < 4.2) continue;
      const pct = (1 - price / old) * 100;
      if (it.sellerName && it.sellerName !== 'Walmart.com' && pct > 60) continue;
      const url = 'https://www.walmart.com' + (it.canonicalUrl || '').split('?')[0];
      if (!url.includes('/ip/')) continue;
      const coupon = it.flag === 'Rollback' ? 'Rollback' : path.endsWith('/clearance') ? 'Clearance' : undefined;
      const picture = /^https:\/\/i5\.walmartimages\.com\/[^?\s]+\.(?:jpe?g|png|webp)/i.exec(it.imageInfo?.thumbnailUrl || it.image || '');
      const d = deal('Walmart', 'walmart', it.name, url, price, old, { coupon, ...(picture ? { image_url: picture[0] } : {}) });
      if (d) {
        if (pageCat) d.category = pageCat === 'Home' && ['Kitchen', 'Tools'].includes(d.category) ? d.category : pageCat;
        if (d.pct >= minPct) cards.push(d);
      }
    }
    await sleep(1500);
  }
  return pick(cards, n, Math.max(4, Math.ceil(n / 5)));
}
