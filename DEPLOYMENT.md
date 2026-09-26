# Aura Vista: scoped collection / studio refresh

## Build and verify

```sh
npm ci
npm run build
npm test
npm run test:e2e
npm audit
```

`public/` is tracked production output. Rebuild and commit it with source changes.
`npm run dev` serves the built site at http://127.0.0.1:4173; it is a static preview, not a serverless API emulator. Use Vercel's runtime for authenticated cloud operations.
Browser tests use Chromium at `/usr/bin/chromium` (see `playwright.config.js`). Studio browser tests intercept API calls with explicit test fixtures; they never write to GitHub or the live Gist. Image preview, photo download, gallery navigation, filters, and modal behavior run in a real browser against real local assets.

## Landing preservation

`index.html`, built `public/index.html`, shared JS/CSS, portfolio JSON, images, and all 120 hero frames are preserved. `tests/landing-lock.json` pins full-file SHA-256 values from baseline `2e3806f`; existing hero tests separately pin animation markup and frames.

`assets/site.css` is the exact previously built Tailwind stylesheet. Build now copies this frozen utility stylesheet rather than regenerating it from changed non-landing markup. This deliberately prevents a gallery/studio change from altering landing utilities. Add styles to `assets/collections.css` or `assets/studio.css`, never to frozen shared files without separate landing approval.

Non-landing pages use self-hosted DM Sans and Cormorant Garamond Latin WOFF2 files; SIL OFL licenses live in `assets/fonts/`. Studio ZIP export uses the already-pinned local JSZip dependency. No new packages.

## Required Vercel secrets

Set through Vercel's secure environment UI, never source files or chat:

- `AURAVISTA_ADMIN_USER`: private single-operator username.
- `AURAVISTA_ADMIN_PASSWORD`: unique, randomly generated password, at least 24 characters. This is not a GitHub/Vercel deployment token.
- `AURAVISTA_GH_TOKEN`: server-only GitHub credential with contents write access to `DhavidFebrian/AuraVista-Web` and, for theme sync, write access to the existing Gist `9919d20671f866fda62afde6b90426e3`.

Missing/short admin credentials return 503 before any upstream request. Invalid credentials return 401. Authenticated cross-site browser requests return 403. Authorization remains in tab memory, not web storage. Serve studio exclusively over HTTPS. Rotate any credentials previously exposed outside a secret manager before deployment.

Configure durable Vercel Firewall rate limiting on `/api/portfolio` and `/api/sync-theme` before opening studio broadly. No in-memory limiter is presented as distributed brute-force protection. Single-operator Basic authentication is retained; teams or MFA require managed identity.

## Storage behavior and limits

Cloud metadata writes use GitHub Contents API SHA conflict detection. A rejected write is not reported as saved. Upload remains the existing two-commit workflow (image, then JSON); a failure between commits can leave an unreferenced image, but existing portfolio data is not replaced. Review concurrent uploads before adopting a multi-user workflow. New photos appear publicly after the GitHub/Vercel rebuild.

Uploads accept JPG/PNG/WebP under 20 MB and 40 megapixels, produce a watermarked WebP up to 1920 px and approximately 3 MB. JSON backup import validates IDs, local image paths, uniqueness, types and size before replacing the in-tab preview. It does not restore cloud data. Downloading a backup exports the current preview.

No production authentication, GitHub writes, Gist writes, push, or deployment are part of local verification. Configure secrets and perform a controlled production smoke test separately.
