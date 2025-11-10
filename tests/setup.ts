// Vitest setup file
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Set environment variables for testing
process.env.VITE_BACKEND_MODE = 'mock';
process.env.VITE_MERKLE_LOGGING_ENABLED = 'true';

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  const crypto = await import('crypto');
  global.crypto = {
    randomUUID: () => crypto.randomUUID(),
    subtle: {
      digest: async (algorithm: string, data: BufferSource) => {
        const hash = crypto.createHash('sha256');
        hash.update(Buffer.from(data as ArrayBuffer));
        return hash.digest().buffer;
      },
    } as SubtleCrypto,
  } as Crypto;
}

// Mock localStorage
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
} as Storage;

// Mock sessionStorage
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
} as Storage;

// Mock Supabase client to prevent network calls
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      limit: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
      lt: () => ({ data: [], error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}));