// Smoke: do the endpoints and the script work at all, within the latency targets?
// Server: AUTH_MODE=dev-stub and a raised RATE_LIMIT_PER_MINUTE (the limit has its own test).
//   k6 run tests/load/smoke.js
import { check, sleep } from 'k6';
import http from 'k6/http';

import { BASE_URL, authHeaders, devUser } from './lib.js';

export const options = {
  vus: 2,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    // Targets: metrics_and_testing.md §3.2 (Proposed).
    http_req_failed: ['rate<0.001'],
    'http_req_duration{name:health}': ['p(95)<50'],
    'http_req_duration{name:ready}': ['p(95)<50'],
    'http_req_duration{name:session}': ['p(95)<200'],
    checks: ['rate>0.999'],
  },
};

// 401 is the expected answer for the "no login" call, not a failure.
http.setResponseCallback(http.expectedStatuses(200, 401));

export default function () {
  const user = devUser(__VU);

  const health = http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
  check(health, {
    'health: 200': (r) => r.status === 200,
    'health: request id header': (r) => Boolean(r.headers['X-Request-Id']),
    'health: security headers': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
  });

  const ready = http.get(`${BASE_URL}/health/ready`, { tags: { name: 'ready' } });
  check(ready, {
    'ready: 200 with database ok': (r) => r.status === 200 && r.json('checks.database') === 'ok',
  });

  const anonymous = http.get(`${BASE_URL}/v1/session`, { tags: { name: 'session-anonymous' } });
  check(anonymous, {
    'no login: 401 UNAUTHENTICATED': (r) => r.status === 401 && r.json('error.code') === 'UNAUTHENTICATED',
  });

  const session = http.get(`${BASE_URL}/v1/session`, { headers: authHeaders(user), tags: { name: 'session' } });
  check(session, {
    'session: 200 with own id only': (r) => r.status === 200 && r.json('user.id') === user,
  });

  sleep(1);
}
