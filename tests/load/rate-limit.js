// Rate-limit check: 429 at exactly the configured limit, for a signed-in user and for a
// caller without a login (by IP), with the standard error format.
// Server: AUTH_MODE=dev-stub and the limit under test (default 120 per minute).
//   k6 run -e EXPECTED_LIMIT=120 tests/load/rate-limit.js
import { check } from 'k6';
import http from 'k6/http';

import { BASE_URL, authHeaders, devUser } from './lib.js';

const LIMIT = Number(__ENV.EXPECTED_LIMIT || 120);
const EXTRA = 10;

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: { checks: ['rate==1'] },
};

function burst(params) {
  const counts = {};
  let lastLimited = null;
  for (let i = 0; i < LIMIT + EXTRA; i++) {
    const res = http.get(`${BASE_URL}/v1/session`, {
      ...params,
      responseCallback: http.expectedStatuses(200, 401, 429),
    });
    counts[res.status] = (counts[res.status] || 0) + 1;
    if (res.status === 429) lastLimited = res;
  }
  console.log(`${params.tags.name}: ${JSON.stringify(counts)}`);
  return { counts, lastLimited };
}

export default function () {
  const signedIn = burst({ headers: authHeaders(devUser(999_001)), tags: { name: 'burst-user' } });
  check(signedIn, {
    [`user: exactly ${LIMIT} accepted`]: (b) => b.counts[200] === LIMIT,
    [`user: the next ${EXTRA} refused with 429`]: (b) => b.counts[429] === EXTRA,
    'user: 429 carries RATE_LIMITED and a request id': (b) =>
      b.lastLimited !== null &&
      b.lastLimited.json('error.code') === 'RATE_LIMITED' &&
      Boolean(b.lastLimited.json('error.requestId')),
  });

  // No login: counted by IP, and limited before the login check (token guessing is limited).
  // Public health checks share the same per-IP allowance, so a few calls made just before
  // this test (e.g. a runner waiting for the server to start) may already be counted.
  const PRIOR = 5;
  const anonymous = burst({ headers: { Authorization: 'Bearer guess' }, tags: { name: 'burst-anonymous' } });
  check(anonymous, {
    [`no login: between ${LIMIT - PRIOR} and ${LIMIT} answered 401`]: (b) =>
      b.counts[401] >= LIMIT - PRIOR && b.counts[401] <= LIMIT,
    'no login: every other call refused with 429': (b) => b.counts[401] + b.counts[429] === LIMIT + EXTRA,
  });
}
