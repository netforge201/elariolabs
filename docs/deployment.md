# Deployment

Build with `npm run build` and run with `npm start`. Set `NODE_ENV=production`, `DATABASE_URL`, `APP_URL`, and a random `SESSION_SECRET` (32 bytes or more). Apply the checked-in SQL migrations using `npm run db:migrate`, then provision neutral defaults using `npm run db:seed` in an explicitly non-production setup. Create the first admin with `INITIAL_ADMIN_EMAIL` and a unique `INITIAL_ADMIN_PASSWORD` (14+ characters) via `npm run db:admin`; the script never logs the password.

Configure `STORAGE_DRIVER=s3` with a bucket, region, credentials, endpoint for S3-compatible services as needed, and a public base URL, or set `STORAGE_DRIVER=imgbb` with the server-side `IMGBB_API_KEY`. ImgBB-hosted images are public. `STORAGE_DRIVER=local` is development-only; production startup refuses it unless `ALLOW_LOCAL_STORAGE_IN_PRODUCTION=true` is deliberately set. Do not rely on container-local disk for production media. Restrict database ingress, terminate TLS at the host, and rotate secrets using the host's secret manager.

The browser-based app build and live flow checks were not run in the authoring environment: npm dependencies are absent and the registry package was not cached. A local PostgreSQL server could not be started because the environment denied PostgreSQL shared-memory setup. Run the build and migration procedure in a normal development/container environment before deployment.

## Decisions required from the owner

- Select the hosting provider, domain, TLS/DNS management, and database backup/restore policy.
- Select an S3-compatible bucket/provider, retention policy, and public delivery/CDN host.
- Set the studio contact email and approved legal policy copy before publishing legal documents.
- Decide whether to enable aggregate page analytics (`ANALYTICS_ENABLED=true`). It defaults off.
- Configure outbound email delivery if notification or message-reply email is required; message intake works without outbound email.

## Known implementation gaps

- The core application create/edit/publish, public catalog/detail/changelog, page editing, site settings/navigation, contact inbox, media upload, support/legal/release creation, user creation, and analytics status flows are present.
- Full inline editing for existing support articles and FAQs, platform URL assignment, feature editing, richer media association/reordering, a complete command palette, and session-gated draft preview remain to be implemented.
- The prototype's responsive visual structure and tokens inform a custom CSS implementation, but page-by-page desktop/tablet/mobile browser comparisons could not be performed in this environment.
