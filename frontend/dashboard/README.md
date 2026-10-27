# Dashboard MVP

Next.js MVP admin dashboard (Clerk-like starter) for Hanko users.

## Run

From `frontend/`:

```bash
npm install
npm --workspace dashboard run dev
```

The app starts at `http://localhost:4606`.

## Required environment variables

Copy `.env.example` to `.env.local` inside `frontend/dashboard`:

```bash
cp dashboard/.env.example dashboard/.env.local
```

Set:

- `HANKO_ADMIN_BASE_URL` (default `http://localhost:4605`)
- `HANKO_ADMIN_TOKEN` (admin bearer token)

The dashboard calls the Admin API through server-side route handlers at `app/api/admin/[...path]/route.js`, so the token is not exposed to the browser.

## MVP screens

- `/admin/users` user list + create user + search
- `/admin/users/[id]` user profile, sessions, metadata, delete
