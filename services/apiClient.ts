import { hc } from 'hono/client';
import type { AppType } from '../server';

// Use origin-aware URL for production and standard localhost for dev
const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const client = hc<AppType>(baseUrl);

export type Api = typeof client;
