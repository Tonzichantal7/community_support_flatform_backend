import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file (if it exists)
// In production (Docker/Render), env vars are injected directly
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  // .env file not found - this is OK in production
  console.log('[dotenv] No .env file found, using environment variables');
} else {
  console.log(`[dotenv] Loaded ${Object.keys(result.parsed || {}).length} vars from ${envPath}`);
}

export {};