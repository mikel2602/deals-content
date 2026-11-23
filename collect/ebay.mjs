import { deal, pick, sleep, text } from './lib.mjs';

const PAGES = [['/globaldeals', null], ['/globaldeals/tech', 'Tech'], ['/globaldeals/home', 'Home'], ['/globaldeals/fashion', 'Fashion']];

/** eBay's public deals pages: fixed-price listings shown with a previous price and the listing's own picture. */
export async function collectEbay({ minPct = 25, n = 15 }) {
  const cards = [];
  for (const [path, pageCat] of PAGES) {
    let html = '';
    try {
      html = await text('https://www.ebay.com' + path);
    } catch (e) {
      console.error(`ebay ${path}: ${e.message || e}`);
    }
    const tiles = html.split(/<div[^>]*class="dne-itemtile dne-itemtile-[^"]*"/).slice(1);
    if (process.env.DEBUG_EBAY) {
      let shown = 0;
      for (const tile of tiles) {
        const plain = tile.replace(/data-click='[^']*'/g, '');
        const hits = [...plain.matchAll(/.{0,90}(?:coupon|promo|% ?off|\bcode\b|refurb|pre-owned|condition|certified).{0,90}/gi)].map((m) => m[0].replace(/\s+/g, ' '));
        if (hits.length && shown < 12) { shown++; console.error(`ebay ${path} tile marks: ${JSON.stringify(hits.slice(0, 3))}`); }
      }
      console.error(`ebay ${path}: tiles ${tiles.length}`);
    }
    for (const tile of tiles) {
      const link = /href="?(https:\/\/www\.ebay\.com\/itm\/\d+)/.exec(tile);
      const title = /itemprop="?name"?[^>]*>([^<]+)</.exec(tile);
      const price = /itemprop="?price"?[^>]*>(?:US\s)?\$\s?([\d,]+\.\d{2})/.exec(tile);
      const old = /itemtile-price-strikethrough[^>]*>(?:US\s)?\$\s?([\d,]+\.\d{2})/.exec(tile);
      if (!link || !title || !price || !old) continue;
      if (/eBay Refurbished|Certified Refurbished/i.test(tile)) continue;
      const picture = /(?:data-config-src|src)="?(https:\/\/i\.ebayimg\.com\/images\/g\/[^\/"\s>]+\/s-l\d+\.(?:jpe?g|png|webp))/.exec(tile);
      const d = deal('eBay', 'ebay', title[1], link[1], Number(price[1].replace(/,/g, '')), Number(old[1].replace(/,/g, '')), picture ? { image_url: picture[1] } : {});
      if (d) { if (d.category === 'Other' && pageCat) d.category = pageCat; if (d.pct >= minPct) cards.push(d); }
    }
    await sleep(1500);
  }
  return pick(cards, n, Math.max(4, Math.ceil(n / 4)));
}
