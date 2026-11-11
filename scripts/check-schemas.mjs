// The root app and apps/invitations share ONE database, and the host runs
// `prisma db push` from each project's schema on every (re)start. If the two
// schemas differ, each push drops the other's columns/tables (and their data).
// Fail the build when they drift apart.
import { readFileSync } from 'node:fs';

const a = 'prisma/schema.prisma';
const b = 'apps/invitations/prisma/schema.prisma';
let left, right;
try {
  left = readFileSync(a, 'utf8');
  right = readFileSync(b, 'utf8');
} catch {
  process.exit(0); // invitations app not present in this checkout
}
if (left.replace(/\r\n/g, '\n') !== right.replace(/\r\n/g, '\n')) {
  console.error(`\n${a} and ${b} differ.\nThey share one database; keep them identical (copy one over the other) before deploying.\n`);
  process.exit(1);
}
