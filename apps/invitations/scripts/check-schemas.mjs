// Same guard as the repo-root scripts/check-schemas.mjs, runnable from this app.
// When the app is built on its own (host copies only apps/invitations), the root
// schema is not there and the check is skipped; the root app's build still runs it.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mine = path.join(app, 'prisma/schema.prisma');
const root = path.join(app, '../../prisma/schema.prisma');
if (!existsSync(root)) process.exit(0);
const norm = file => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (norm(mine) !== norm(root)) {
  console.error(`\n${mine} and ${root} differ.\nThey share one database; keep them identical before deploying.\n`);
  process.exit(1);
}
