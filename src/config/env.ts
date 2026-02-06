import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from project root .env (use cwd to be robust)
const _envPath = path.resolve(process.cwd(), '.env');
const _dotenvResult = dotenv.config({ path: _envPath });
console.log(`[dotenv] loaded ${Object.keys(_dotenvResult.parsed || {}).length} vars from ${_envPath}`);

export {};
