# Local database setup

One-time setup of PostgreSQL 17 on your computer for development. You choose the password; it only ever goes into `services/backend/.env`, which git ignores. Never paste it into chat, issues or commits.

## 1. Start PostgreSQL

The Windows service is named `postgresql-x64-17`. Open **PowerShell as Administrator** and run:

```powershell
Start-Service postgresql-x64-17
Set-Service postgresql-x64-17 -StartupType Automatic
```

## 2. Create the app's own user and two databases

Open **SQL Shell (psql)** from the Start menu, or run `psql -U postgres -h localhost`, and sign in with the `postgres` password you chose when installing PostgreSQL. Then run, replacing `choose-a-password` with a new password of your own:

```sql
CREATE ROLE wildself_app LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE wildself_dev  OWNER wildself_app;
CREATE DATABASE wildself_test OWNER wildself_app;
```

- `wildself_app` is not a superuser: it can only manage its own two databases.
- `wildself_test` is wiped by integration tests. Never point tests at `wildself_dev`.

## 3. Create `services/backend/.env`

Copy `services/backend/.env.example` to `services/backend/.env` and put your password into both URLs:

```text
DATABASE_URL=postgres://wildself_app:choose-a-password@localhost:5432/wildself_dev
TEST_DATABASE_URL=postgres://wildself_app:choose-a-password@localhost:5432/wildself_test
```

If the password contains `@`, `:`, `/` or `#`, write it percent-encoded (for example `@` → `%40`).

Each setting must appear **only once**. If a line appears twice, the last copy wins silently, so a leftover `CHANGE_ME` line or a second line with a different password causes "password authentication failed". Both URLs use the same `wildself_app` account, so they must carry the same password.

## 4. Check it works

```bash
npm run db:migrate          # applies migrations to wildself_dev
npm run test --workspace packages/data   # runs the data-layer integration tests
npm run api:dev             # then open http://127.0.0.1:3000/health/ready
```

`/health/ready` should answer `{"status":"ok","checks":{"database":"ok"}}`.
