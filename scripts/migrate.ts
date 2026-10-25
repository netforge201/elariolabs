import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

try {
  process.loadEnvFile('.env');
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

async function main() {
  const { Client } = pg;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("SELECT pg_advisory_lock(hashtext('elariolabs:migrations'))");
  try {
    await client.query('CREATE TABLE IF NOT EXISTS _elario_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const folder = path.resolve('migrations');
    const files = (await readdir(folder)).filter(file => file.endsWith('.sql')).sort();
    for (const file of files) {
      const done = await client.query('SELECT 1 FROM _elario_migrations WHERE name=$1', [file]);
      if (done.rowCount) continue;
      const sql = await readFile(path.join(folder, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _elario_migrations(name) VALUES($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('elariolabs:migrations'))").catch(() => {});
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
