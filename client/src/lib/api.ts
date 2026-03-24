/**
 * This file previously held an axios instance that talked to the backend.
 * It's now a thin shim — the real logic lives in localDB.ts and the stores.
 * Kept only for any lingering imports; all actual API work is done locally.
 */

// No-op default export so old `import api from '../lib/api'` doesn't blow up.
const api = {
  get: (_url: string, _opts?: any) => Promise.resolve({ data: null }),
  post: (_url: string, _body?: any, _opts?: any) => Promise.resolve({ data: null }),
  put: (_url: string, _body?: any) => Promise.resolve({ data: null }),
  delete: (_url: string) => Promise.resolve({ data: null }),
};

export default api;
