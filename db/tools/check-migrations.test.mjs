import { describe, expect, it } from 'vitest';

import { findForbidden } from './check-migrations.mjs';

describe('findForbidden', () => {
  it('accepts plain tables, indexes and constraints', () => {
    const sql = `
      create table habits (
        id uuid primary key,
        user_id uuid not null references users (id) on delete cascade,
        title text not null check (char_length(title) between 1 and 60),
        created_at timestamptz not null default now()
      );
      create index habits_user_id on habits (user_id);
    `;
    expect(findForbidden(sql)).toEqual([]);
  });

  it.each([
    ['create function f() returns int as $$ select 1 $$ language sql;', 'stored functions'],
    ['CREATE OR REPLACE FUNCTION f() RETURNS trigger AS $$ BEGIN END $$ LANGUAGE plpgsql;', 'stored functions'],
    ['create procedure p() language sql as $$ select 1 $$;', 'stored procedures'],
    ['create trigger t after insert on x for each row execute function f();', 'triggers'],
    ['create constraint trigger t after insert on x for each row execute function f();', 'triggers'],
    ['create rule r as on insert to x do instead nothing;', 'rules'],
    ['do $$ begin perform 1; end $$;', 'anonymous code blocks'],
    ["select cron.schedule('x', '* * * * *', 'select 1');", 'scheduled jobs'],
    ['create extension pg_cron;', 'scheduled jobs'],
    ['alter table x add column total int generated always as (a + b) stored;', 'generated columns'],
  ])('rejects %s', (sql, reason) => {
    const findings = findForbidden(sql);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.map((f) => f.reason).join(' ')).toContain(reason);
  });

  it('ignores forbidden words inside comments', () => {
    const sql = `
      -- never: create function f() ...
      /* create trigger t ... */
      create table ok (id uuid primary key);
    `;
    expect(findForbidden(sql)).toEqual([]);
  });
});
