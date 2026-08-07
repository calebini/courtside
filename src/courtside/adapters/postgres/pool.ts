import {Pool} from 'pg';

export function createPostgresPool(connectionString: string): Pool {
  if (!connectionString) {
    throw new Error('A server-only PostgreSQL connection string is required');
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000
  });
}
