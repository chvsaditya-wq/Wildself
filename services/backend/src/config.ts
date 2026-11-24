import { z } from 'zod';

/**
 * Every setting the backend reads, validated once at start-up (ARCHITECTURE.md §3.6).
 * A missing or unsafe value stops the process with a clear message instead of letting it
 * half-work. Secrets come only from the environment, never from code or git.
 */

export type Role = 'api' | 'worker';

const booleanFlag = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must start with postgres:// or postgresql://'),
    DATABASE_SSL: z.enum(['require', 'disable']).optional(),
    DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(100).default(10),

    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    /** Set to true only behind a host's proxy, so rate limits see the real client IP. */
    TRUST_PROXY: booleanFlag.default(false),
    /** Largest request body accepted, in bytes (256 KB, ARCHITECTURE.md §3.5). */
    BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(1_048_576).default(262_144),
    /** Requests per minute per client before 429. */
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10_000).default(120),

    /** `deny-all` until the auth provider is chosen (before Phase 1). `dev-stub` is for local work only. */
    AUTH_MODE: z.enum(['deny-all', 'dev-stub']).default('deny-all'),

    SENTRY_DSN: z.url().optional(),
    /** Build id or git sha, attached to error reports. */
    RELEASE: z.string().max(100).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.AUTH_MODE === 'dev-stub') {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_MODE'],
        message: 'dev-stub login is never allowed in production',
      });
    }
    if (env.DATABASE_SSL === 'disable') {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_SSL'],
        message: 'the database connection must use TLS in production',
      });
    }
    if (!env.SENTRY_DSN) {
      ctx.addIssue({
        code: 'custom',
        path: ['SENTRY_DSN'],
        message: 'error reporting is required in production, so failures are never silent',
      });
    }
  });

export type Config = {
  role: Role;
  env: 'development' | 'test' | 'production';
  logLevel: z.infer<typeof EnvSchema>['LOG_LEVEL'];
  database: { url: string; ssl: 'require' | 'disable'; maxConnections: number };
  http: {
    host: string;
    port: number;
    trustProxy: boolean;
    bodyLimitBytes: number;
    rateLimitPerMinute: number;
  };
  authMode: 'deny-all' | 'dev-stub';
  sentry: { dsn: string | undefined; release: string | undefined };
};

export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

/** Reads `--role=api|worker` from the command line, falling back to the ROLE variable. */
export function readRole(argv: readonly string[], env: Record<string, string | undefined>): Role {
  const flag = argv.find((arg) => arg.startsWith('--role='))?.slice('--role='.length);
  const role = flag ?? env.ROLE;
  if (role === 'api' || role === 'worker') return role;
  throw new ConfigError([`role must be "api" or "worker" (got ${role ? `"${role}"` : 'nothing'})`]);
}

export function loadConfig(role: Role, env: Record<string, string | undefined>): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    // Messages name the setting but never echo its value, which may be a secret.
    throw new ConfigError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`),
    );
  }
  const e = parsed.data;
  return {
    role,
    env: e.NODE_ENV,
    logLevel: e.LOG_LEVEL,
    database: {
      url: e.DATABASE_URL,
      // Safe default: TLS on in production, off locally unless asked for.
      ssl: e.DATABASE_SSL ?? (e.NODE_ENV === 'production' ? 'require' : 'disable'),
      maxConnections: e.DATABASE_MAX_CONNECTIONS,
    },
    http: {
      host: e.HOST,
      port: e.PORT,
      trustProxy: e.TRUST_PROXY,
      bodyLimitBytes: e.BODY_LIMIT_BYTES,
      rateLimitPerMinute: e.RATE_LIMIT_PER_MINUTE,
    },
    authMode: e.AUTH_MODE,
    sentry: { dsn: e.SENTRY_DSN, release: e.RELEASE },
  };
}
