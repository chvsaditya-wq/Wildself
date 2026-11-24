// Breakpoint: raise the request rate until a target fails, to find the real capacity of one
// API instance on the machine it runs on. Uses the full request pipeline (request id, security
// headers, login, rate limit, route, error format) on GET /v1/session.
// Server: AUTH_MODE=dev-stub and RATE_LIMIT_PER_MINUTE=10000 (each request uses one of many
// users, so the per-user limit is never the bottleneck).
//   k6 run -e MAX_RATE=4000 tests/load/breakpoint.js
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';

import { BASE_URL, authHeaders, devUser } from './lib.js';

const MAX_RATE = Number(__ENV.MAX_RATE || 4000);
const USERS = 5000;

export const options = {
  scenarios: {
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [{ target: MAX_RATE, duration: __ENV.RAMP || '3m' }],
    },
  },
  thresholds: {
    // Stop at the first sustained miss of a target (metrics_and_testing.md §3.2).
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '10s' }],
    http_req_duration: [{ threshold: 'p(95)<200', abortOnFail: true, delayAbortEval: '10s' }],
  },
};

export default function () {
  const user = devUser(exec.scenario.iterationInTest % USERS);
  const res = http.get(`${BASE_URL}/v1/session`, { headers: authHeaders(user) });
  check(res, { '200': (r) => r.status === 200 });
}
