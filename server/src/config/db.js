import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is always loaded from server/.env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Safely decodes a URI component without throwing URIError on malformed sequences.
 */
function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Normalizes MongoDB URI by stripping leading key names if accidentally included,
 * trimming whitespace, and safely encoding password characters like '@' if unencoded.
 * Does NOT encode the host, path, or query string.
 */
export function normalizeMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  let uri = rawUri.trim();

  // Strip accidental "MONGODB_URI=" prefix if pasted with key name (case-insensitive, handles whitespace)
  while (/^MONGODB_URI\s*=\s*/i.test(uri)) {
    uri = uri.replace(/^MONGODB_URI\s*=\s*/i, '').trim();
  }

  // Strip wrapping quotes if present
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Handle unencoded '@' inside password (e.g. user:passPart1@passPart2@host/db)
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.*)$/);
  if (match) {
    const [, protocol, user, pass, rest] = match;
    if (rest.includes('@')) {
      const lastAtIndex = rest.lastIndexOf('@');
      const extraPassPart = rest.substring(0, lastAtIndex);
      const actualHostAndQuery = rest.substring(lastAtIndex + 1);
      const fullPass = `${pass}@${extraPassPart}`;
      return `${protocol}${encodeURIComponent(safeDecode(user))}:${encodeURIComponent(safeDecode(fullPass))}@${actualHostAndQuery}`;
    }
  }

  return uri;
}

/**
 * Extracts safe diagnostic metadata from URI without ever revealing the password.
 */
export function getSafeConnectionDetails(rawUri) {
  if (!rawUri) {
    return { error: 'MONGODB_URI is not set in environment variables' };
  }

  const normalized = normalizeMongoUri(rawUri);

  try {
    // Parse using standard URL by replacing protocol with http
    const tempUrl = new URL(normalized.replace(/^mongodb(?:\+srv)?:\/\//, 'http://'));
    return {
      protocol: normalized.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb',
      username: tempUrl.username || '(none)',
      hostname: tempUrl.hostname || '(none)',
      database: tempUrl.pathname ? tempUrl.pathname.replace(/^\//, '') : '(default)',
      hasPassword: Boolean(tempUrl.password),
      passwordLength: tempUrl.password ? tempUrl.password.length : 0,
      hasDuplicatedPrefix: /^MONGODB_URI\s*=\s*/i.test(rawUri.trim()),
    };
  } catch {
    return {
      error: 'URI format could not be parsed structurally',
      rawLength: rawUri.length,
    };
  }
}

/**
 * Masks user credentials from connection strings for safe logging.
 */
export function maskMongoUri(uri) {
  if (!uri) return '(empty)';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@');
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Prints safe diagnostic output (hostname, username, database) but never the password.
 */
export async function connectDB() {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables.';
    console.error(`[DB Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const details = getSafeConnectionDetails(rawUri);
  console.log('[DB Diagnostic] Target Connection:');
  console.log(`  - Host:          ${details.hostname}`);
  console.log(`  - Database:      ${details.database}`);
  console.log(`  - User:          ${details.username}`);
  console.log(`  - Protocol:      ${details.protocol}://`);
  console.log(`  - Has Password:  ${details.hasPassword ? `YES (${details.passwordLength} chars)` : 'NO'}`);
  if (details.hasDuplicatedPrefix) {
    console.log('  - Notice:        Stripped duplicate "MONGODB_URI=" prefix from environment variable.');
  }

  const normalizedUri = normalizeMongoUri(rawUri);

  try {
    const conn = await mongoose.connect(normalizedUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[DB Success] MongoDB connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB Error] MongoDB connection failed: ${error.message}`);
    if (error.message && error.message.toLowerCase().includes('bad auth')) {
      console.error(`[DB Diagnostic] Authentication failed for user "${details.username}" on host "${details.hostname}".`);
      console.error(`[DB Diagnostic] Please verify in MongoDB Atlas > Database Access that user "${details.username}" exists and the password is correct.`);
    }
    throw error;
  }
}

/**
 * Disconnects from MongoDB Atlas.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DB Info] MongoDB disconnected.');
  }
}

export default connectDB;
