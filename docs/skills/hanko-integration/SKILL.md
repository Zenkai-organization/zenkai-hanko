# Hanko Multi-App Integration Skill

## Purpose
Use one Hanko backend to authenticate users across multiple applications (web apps, dashboards, and internal tools) with consistent security and configuration.

## When to use this skill
- You want to connect a new app to the existing Hanko service.
- You need one user identity system for multiple frontends.
- You need a checklist for CORS, passkeys, redirects, and sessions.

## Required inputs
- Public API URL (example: `http://localhost:4604`)
- Admin API URL (example: `http://localhost:4605`)
- App origin(s) (example: `http://localhost:3000`, `http://localhost:4606`)
- Redirect callback URLs for OAuth/OIDC
- Session strategy (cookie-based or header token)

## Integration checklist

### 1) Backend config for multiple apps
Update `backend/config/config.yaml` (or your deployment config):

```yaml
server:
  public:
    cors:
      allow_origins:
        - "http://localhost:3000"
        - "http://localhost:4606"

webauthn:
  relying_party:
    id: "localhost"
    origins:
      - "http://localhost:3000"
      - "http://localhost:4606"

third_party:
  redirect_url: "http://localhost:4604/thirdparty/callback"
  error_redirect_url: "http://localhost:4606"
  allowed_redirect_urls:
    - "http://localhost:3000**"
    - "http://localhost:4606**"
```

If apps live on different domains and cookie sharing is difficult:

```yaml
session:
  enable_auth_token_header: true
```

### 2) Start and verify Hanko
- Run backend (this repo): `bash script/run.sh`
- Verify:
  - Public API: `curl http://localhost:4604/.well-known/jwks.json`
  - Admin API: `curl http://localhost:4605/`

### 3) Frontend app integration
For each app:
- Point frontend SDK/elements to `HANKO_URL` (public API).
- Add app origin to both:
  - `server.public.cors.allow_origins`
  - `webauthn.relying_party.origins`
- Configure callback URLs in `third_party.allowed_redirect_urls` for OAuth/OIDC.

### 4) Admin/dashboard integration
- Never expose admin token in browser.
- Use server-side proxy/BFF route for Admin API.
- Pass `Authorization: Bearer <admin-token>` only from server.

### 5) Registration flow testing
Use this repo script:

```bash
bash script/test_registration.sh
```

It should end with `"name": "success"`.

## Troubleshooting map
- `CORS error` -> missing origin in `server.public.cors.allow_origins`
- `Passkey origin error` -> missing origin in `webauthn.relying_party.origins`
- `OAuth redirect blocked` -> missing URL in `third_party.allowed_redirect_urls`
- `Cannot connect DB` -> verify `database.host/port/user/password/database`
- `Admin dashboard 401/403` -> invalid or missing admin bearer token

## Production notes
- Use HTTPS for all app origins.
- Use environment-specific config files (dev/staging/prod).
- Protect Admin API behind internal network and strict access control.
- Rotate secrets and admin tokens regularly.
