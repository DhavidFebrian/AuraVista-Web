# Aura Vista Studio

## Build, test, and publish

Use Node.js 24. Run `npm ci`, `npm run build`, `npm test`, and `npm run test:e2e`.
`npm run dev` serves the source at http://127.0.0.1:4173 with the real API handlers.
Browser tests launch an isolated in-memory GitHub upstream fixture; they never mutate production data.
`public/` is generated output and is not tracked. Only the six HTML pages and `assets/` are published;
local scripts, environment files, tests, and server source are not public static files.

Push to GitHub, then run `vercel deploy --prod --yes` while authenticated to the existing `davv/aura-vista` project.
The Vercel project currently has no Git login connection, so source-code pushes alone do not trigger a deployment.
Connecting that login in Vercel can enable automated code deployments later.

## Admin access

The server requires `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (scrypt salt:hex hash),
`ADMIN_SESSION_SECRET` (at least 32 characters), and the existing `AURAVISTA_GH_TOKEN`.
Configure through Vercel environment management. `scripts/configure-admin.mjs` rotates the admin
credentials and writes a local-only `work/ADMIN-ACCESS.txt`; running it invalidates existing sessions after redeployment.
Never commit that directory or environment files. The old password embedded in the historical HTML is no longer accepted.
Authentication uses a signed, eight-hour, HttpOnly, Secure, SameSite=Strict session cookie in production.
Writes require the server session, same-origin requests, and JSON content type. Per-instance login throttling
is a best-effort additional control, not distributed rate limiting. For a larger team, use a managed identity service.

## Media persistence

`AURAVISTA_GH_TOKEN` needs contents write access to `DhavidFebrian/AuraVista-Web` and write access
to the existing Gist `9919d20671f866fda62afde6b90426e3`. Tokens are never sent to the browser.
Uploads commit the image and metadata together using a Git tree. SHA checks plus a non-forced branch update
prevent concurrent writes from silently overwriting each other. The UI shows errors instead of claiming success.
The public gallery reads the live API, with the deployed JSON as an explicit availability fallback.
New uploaded image paths use GitHub's public raw endpoint, so publishing a photo does not depend on a Vercel rebuild.
Source-code changes still require deployment. Preview and production both target the same repository if given its token;
never run destructive QA against those environments. Use local isolated fixtures.

Album metadata lives in `assets/albums.json`. Administrators create albums from the upload form through
`POST /api/albums`; the registry uses the same SHA conflict protection as photo metadata. Album names must
be unique and each album requires a location. Newly created albums are immediately available in upload,
edit, filters, and `album.html?id=<album-id>`. The landing page shows custom albums once they contain a photo.
Album creation does not reset the current upload draft and does not require another deployment.

Uploads accept JPG, PNG, and WebP under 20 MB, scale to 2,400 px, apply the studio watermark, and produce
WebP below 2.8 MB. JSON restore previews the item count, requires confirmation, validates every item,
and persists to the server; references must be existing collection images. Deletion removes metadata,
while original image files remain in GitHub. Download JSON and selected image ZIPs for a complete backup.
CSV exports neutralize spreadsheet formula prefixes. The activity list is local browser history, not a server audit log.

## Protected landing video

`tests/hero.test.mjs` checks the original hero markup, CSS, scroll engine, and all 120 frames against
baseline `80d6c96`. Other page sections may change, as requested. The inherited full-landing lock has been
narrowed to original media assets; it no longer prevents authorized changes to galleries or contact forms.
Landing utilities remain the frozen `assets/site.css`. Icons and ZIP libraries are pinned local assets.
Admin and collection fonts are self-hosted with their OFL licenses.

Upload supports up to 20 photographs per queue (20 MB per input). Each image is watermarked and compressed separately; sequential requests respect the function body limit. Successful entries leave the queue, and pending entries remain available after a failure. Album, location, and description apply to the batch; each photograph has its own title.

Album covers are selected from existing photos in the media library. Authenticated PUT /api/albums stores coverPhotoId with album SHA protection and validates photo membership against the same Git commit. Public album cards and collection covers resolve the selected photo, falling back to the first remaining album photo if it is deleted or moved. The landing scroll hero is unchanged.
