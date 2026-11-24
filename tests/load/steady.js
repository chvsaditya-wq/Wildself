// Steady load: a fixed request rate for a fixed time. Used for "average load" and "peak"
// (metrics_and_testing.md §2.2, §5) and to measure latency at chosen rates.
// Server: AUTH_MODE=dev-stub and RATE_LIMIT_PER_MINUTE=10000.
//   k6 run -e RATE=1000 -e DURATION=30s tests/load/steady.js
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';

import { BASE_URL, authHeaders, devUser } from './lib.js';

const RATE = Number(__ENV.RATE || 100);
const USERS = 5000;

export const options = {
  scenarios: {
    steady: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: __ENV.DURATION || '30s',
      preAllocatedVUs: Math.min(50 + RATE, 1500),
      maxVUs: 2000,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<200', 'p(99)<500'],
  },
};

export default function () {
  const user = devUser(exec.scenario.iterationInTest % USERS);
  const res = http.get(`${BASE_URL}/v1/session`, { headers: authHeaders(user) });
  check(res, { '200': (r) => r.status === 200 });
}
