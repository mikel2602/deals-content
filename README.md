# deals-content

Content files for the DealsSaver app, served as static files from GitHub Pages (`docs/`).

- `docs/deals.json` is rebuilt every two days by the `refresh` workflow from the public deal pages of Walmart and eBay. Woot's developer feed is read too when its key (`WOOT_KEY` repository secret) is accepted; Woot paused its developer program on 2026-11-20, and while it stays closed the other stores supply more cards. Each source is independent: if one fails, its earlier cards stay for a few days and the others are published. Cards carry the listing's own picture; before publishing, the words printed inside each new picture are read (Tesseract on the runner) and a picture that shows a coupon, promo code or "% off" banner is left out, as are refurbished and used listings. `docs/pictures.json` lists the pictures that passed. `docs/status.json` records every run.
- The other `docs/*.json` files (settlements, refunds, repair programs, fee refund policies and rules) are updated by hand.
- `docs/privacy.html` is the app's privacy policy.

Run locally: `WOOT_KEY=… node collect/build.mjs` (Node 20 or newer, no dependencies).
