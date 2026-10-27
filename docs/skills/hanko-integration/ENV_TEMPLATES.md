# Hanko Integration Env Templates

Copy these templates and adjust values per environment.

## 1) Backend (`backend/.env` or deployment env)

```bash
# Server ports
SERVER_PUBLIC_ADDRESS=0.0.0.0:4604
SERVER_ADMIN_ADDRESS=0.0.0.0:4605

# Database
DATABASE_HOST=192.168.1.237
DATABASE_PORT=5432
DATABASE_NAME=zenkai-hanko
DATABASE_USERNAME=trg
DATABASE_PASSWORD=trangbg2k
DATABASE_DIALECT=postgres

# Email delivery (example: mailslurper for dev)
EMAIL_DELIVERY_ENABLED=true
EMAIL_DELIVERY_SMTP_HOST=localhost
EMAIL_DELIVERY_SMTP_PORT=2500
EMAIL_DELIVERY_FROM_ADDRESS=noreply@hanko.io
EMAIL_DELIVERY_FROM_NAME=Hanko

# Session behavior (use true if apps are cross-domain)
SESSION_ENABLE_AUTH_TOKEN_HEADER=false

# Keys (example only, replace in production)
SECRETS_KEYS=abcedfghijklmnopqrstuvwxyz
```

## 2) Frontend App (`<your-app>/.env.local`)

```bash
# Public Hanko API URL used by frontend SDK/elements
NEXT_PUBLIC_HANKO_URL=http://localhost:4604

# If you serve Hanko Elements from your own host, set it here
NEXT_PUBLIC_HANKO_ELEMENTS_URL=http://localhost:4603/elements.js
NEXT_PUBLIC_HANKO_SDK_URL=http://localhost:4603/sdk.modern.js
```

## 3) Dashboard (`frontend/dashboard/.env.local`)

```bash
# Admin API base URL (server-side only)
HANKO_ADMIN_BASE_URL=http://localhost:4605

# Admin bearer token (server-side only, never expose in browser)
HANKO_ADMIN_TOKEN=replace-with-admin-token
```

## 4) Optional script overrides

For `script/run.sh`:

```bash
HANKO_CONFIG=/absolute/path/to/config.yaml
HANKO_BIN=/absolute/path/to/zenkai-hanko
HANKO_SERVE_MODE=all
HANKO_PUBLIC_PORT=4604
HANKO_ADMIN_PORT=4605
HANKO_DEV_FRONTEND_PORT=4606
HANKO_BUILD_ON_START=1
HANKO_FORCE_REBUILD=0
```

## Verification quick commands

```bash
curl -sS -o /dev/null -w "public %{http_code}\n" http://localhost:4604/.well-known/jwks.json
curl -sS -o /dev/null -w "admin %{http_code}\n" http://localhost:4605/
curl -sS -o /dev/null -w "dashboard %{http_code}\n" http://localhost:4606/admin/users
```
