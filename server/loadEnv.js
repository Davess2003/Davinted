// Load server/.env by absolute path, regardless of the process working
// directory. (`import 'dotenv/config'` only reads .env from cwd, which is the
// project root when started via `npm run server` — so it would miss this file.)
// Imported first in index.js so process.env is populated before any other
// module (supabase.js, etc.) reads it.
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(here, '.env') });
