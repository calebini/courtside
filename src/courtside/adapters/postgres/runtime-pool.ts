import 'server-only';

import type {Pool} from 'pg';

import {createPostgresPool} from './pool';

const runtime = globalThis as typeof globalThis & {courtsidePostgresPool?: Pool};

export function getRuntimePostgresPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for server-side domain access');
  }

  runtime.courtsidePostgresPool ??= createPostgresPool(connectionString);
  return runtime.courtsidePostgresPool;
}
