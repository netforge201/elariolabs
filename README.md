# ElarioLabs Studio

Server-rendered public studio website and database-backed CMS. It starts with no applications.

## Local setup

1. Install Node.js 20+ and PostgreSQL 15+.
2. Copy `.env.example` to `.env`, set `DATABASE_URL`, and generate a `SESSION_SECRET`.
3. Run `npm install`, `npx prisma generate`, `npm run db:migrate`, then run `npm run db:seed` in a non-production environment. The database scripts read `.env` automatically. Set `INITIAL_ADMIN_EMAIL` plus a unique 14+ character `INITIAL_ADMIN_PASSWORD` before `npm run db:admin`.
4. Run `npm run dev`; sign in at `/admin/login`.

Use `npm run build` and `npm start` for production. Media can use S3-compatible storage or ImgBB. To host images on ImgBB, set `STORAGE_DRIVER=imgbb` and `IMGBB_API_KEY` in the untracked `.env` file. The key is used only for server-side uploads; ImgBB-hosted images are public. See [architecture](docs/architecture.md), [deployment](docs/deployment.md), and [design decisions](docs/design-decisions.md).
