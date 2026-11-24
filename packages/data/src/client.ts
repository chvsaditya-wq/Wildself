import postgres from 'postgres';

export type Sql = postgres.Sql;

export type Database = {
  sql: Sql;
  /** Closes every connection, waiting up to 5 s for running queries. */
  close(): Promise<void>;
};

export type DatabaseOptions = {
  url: string;
  /** Shown in PostgreSQL's activity view, e.g. "wildself-api". */
  applicationName: string;
  maxConnections?: number;
  /** Longest any single query may run, in seconds. */
  queryTimeoutSeconds?: number;
  /** TLS to the database. Required in staging and production. */
  ssl: 'require' | 'disable';
};

/**
 * Opens the connection pool. Every connection works in UTC and has a hard
 * statement timeout on the server side as well as on the client side, so a stuck
 * query can never hold the app hostage.
 */
export function createDatabase(options: DatabaseOptions): Database {
  const timeout = options.queryTimeoutSeconds ?? 10;

  const sql = postgres(options.url, {
    max: options.maxConnections ?? 10,
    idle_timeout: 30,
    connect_timeout: 10,
    queue_timeout: 10,
    query_timeout: timeout,
    ssl: options.ssl === 'require' ? 'require' : false,
    // Notices are informational; real problems arrive as errors.
    onnotice: false,
    connection: {
      application_name: options.applicationName,
      TimeZone: 'UTC',
      statement_timeout: timeout * 1000,
      idle_in_transaction_session_timeout: 30_000,
    },
  });

  return {
    sql,
    close: () => sql.end({ timeout: 5 }),
  };
}
