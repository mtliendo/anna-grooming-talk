# Setup — demo-showcase only

Coordinator checklist for the Trust, but Verify talk. **Do not invent Auth0 APIs.** Follow current Auth0 docs for AI Agents, Token Vault, CIBA, and MCP authorization.

> **Forbidden tenants:** `dev-bxdvx0t63i1hlqdi`, `anna-grooming.us.auth0.com`, and any workshop tenant. Do **not** run Auth0 CLI or the Management API against those. Use the **demo-showcase** tenant only (`AUTH0_DOMAIN` hostname, no `https://`).
>
> Never print filled secrets into chat, commits, or this file.

---

## 0. What this app expects

One **Regular Web Application** (confidential, first-party) for the Next.js session cookie **and** CIBA (`client_id` + `client_secret` on `/bc-authorize`).

One **API / resource server** whose identifier is the MCP URL (`https://<prod>/mcp`).

Google as a social connection for login **and** Auth0 Token Vault (Connected Accounts) for Calendar scopes that are **not** requested at Universal Login.

CIBA **email** channel: `requested_expiry` is **301** seconds in code (`lib/ciba.ts`). Auth0 sends email when expiry is 301–259200s; ≤300 is Guardian push.

Neon project **anna-grooming-talk** (do not reuse the older `anna-dog-grooming` database).

---

## 1. Neon

Pooled connection string with `?sslmode=require` → `DATABASE_URL`.

Schema is idempotent (`db/schema.sql` and `ensureSchema()` on boot). Tables: `dogs`, `appointments`, `chat_messages`.

---

## 2. Auth0 Regular Web Application

Dashboard → Applications → Create → **Regular Web Application**.

**Settings → URLs** (repeat for localhost and production):

```
Allowed Callback URLs
http://localhost:3000/auth/callback
https://<prod>/auth/callback

Allowed Logout URLs
http://localhost:3000
https://<prod>

Allowed Web Origins
http://localhost:3000
https://<prod>

Allowed Origins (CORS)
http://localhost:3000
https://<prod>
```

Copy **Domain** (hostname only), **Client ID**, **Client Secret**.

Generate `AUTH0_SECRET`:

```bash
openssl rand -hex 32
```

### Login connections

Enable **Username-Password-Authentication** and **google-oauth2**.

Universal Login must **not** request Google Calendar. Login scopes in code are `openid profile email offline_access` (`lib/auth0.ts`).

---

## 3. Auth0 for AI Agents + Token Vault

Enable **Auth0 for AI Agents** on this tenant (current dashboard: Auth0 for AI Agents / Token Vault).

On the **Google** social connection:

1. Enable **Connected Accounts / Token Vault** (offline access for the connection).
2. Allow the extra scope `https://www.googleapis.com/auth/calendar.events` for connected-account linking — **not** as a default Universal Login scope.
3. Google Cloud OAuth client used by that connection must include the Calendar API and that scope.

The app links Calendar with:

```
/auth/connect?connection=google-oauth2&returnTo=/chat&scopes=openid&scopes=profile&scopes=email&scopes=offline_access&scopes=https://www.googleapis.com/auth/calendar.events
```

SDK: `enableConnectAccountEndpoint: true` and `getAccessTokenForConnection({ connection: "google-oauth2" })`.

If Token Vault has no Google refresh token, the chatbot **pauses** and shows Connect Google Calendar. It must not write a Calendar event until that returns a token.

Docs: [Auth0 for AI Agents](https://auth0.com/ai/docs) · [Token Vault](https://auth0.com/ai/docs) · [Connected Accounts for Token Vault with Next.js](https://auth0.com/ai/docs).

---

## 4. CIBA (real, not a chat prompt)

On the **same Regular Web Application**:

1. Enable grant **Client Initiated Backchannel Authentication (CIBA)**.
2. Enable the **email** authenticator / CIBA notification channel (not Guardian-only).
3. Authorizing user must have a **verified email**. `login_hint` is `iss_sub` (`iss` = `https://<AUTH0_DOMAIN>/`, `sub` = signed-in user).
4. Binding message charset: `A-Za-z0-9+-_.,:#`, max 64. Code sends `Cancel-groom-#<8 hex>`.

This app:

- `POST https://<domain>/bc-authorize` with `client_id`, `client_secret`, `scope=openid`, `binding_message`, `requested_expiry=301`, `login_hint`
- Polls `POST https://<domain>/oauth/token` with `grant_type=urn:openid:params:grant-type:ciba` and `auth_req_id`
- **Deletes the appointment only after `access_token` (approved).** Deny / expiry reverts `cancel_pending` → `booked`.

Docs: [Configure CIBA](https://auth0.com/docs/get-started/applications/configure-client-initiated-backchannel-authentication).

---

## 5. MCP resource server

1. Applications → APIs → Create API.
2. **Identifier** = `https://<prod>/mcp` (must equal `AUTH0_AUDIENCE` / `MCP_SERVER_URL`).
3. Signing algorithm **RS256**.
4. Add permissions (scopes):

   - `tool:list_dogs`
   - `tool:add_dog`
   - `tool:list_appointments`
   - `tool:book_appointment`
   - `tool:cancel_appointment`

   plus `openid` `profile` `email` if you attach them on the resource.

5. Authorize the Regular Web App (and any MCP client / Grok Bot app) to request those scopes.
6. Enable **OIDC Conformant** / Resource Indicators as required by current Auth0 MCP docs so access tokens are audience-bound to the MCP identifier.
7. Protected resource metadata is served at:

   - `/.well-known/oauth-protected-resource`
   - `/.well-known/oauth-protected-resource/mcp` (RFC 9728 path form for `/mcp`)
   - `/mcp/.well-known/oauth-protected-resource` (alias some MCP 401 headers follow)

   JWKS: `https://<AUTH0_DOMAIN>/.well-known/jwks.json`. Authorization server: `https://<AUTH0_DOMAIN>/`. A 401 from `/mcp` advertises the RFC 9728 URL in `WWW-Authenticate` `resource_metadata`; that URL must 200 JSON.

Docs: [Auth0 for MCP](https://auth0.com/ai/docs) · sample [auth0-ai-samples / nextjs-mcp-js](https://github.com/auth0-lab/auth0-ai-samples).

Grok Bot: add server URL `https://<prod>/mcp`, complete Auth0 login, call `list_appointments` then `cancel_appointment`.

---

## 6. Vercel

Project name: **anna-grooming-talk**. Do **not** modify the existing `anna-dog-grooming` Vercel project.

Set env for Production, Preview, and Development:

- `AUTH0_SECRET`
- `APP_BASE_URL` = `https://<prod-domain>` (no trailing slash)
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET` (sensitive)
- `AUTH0_AUDIENCE` = `https://<prod-domain>/mcp`
- `DATABASE_URL` (sensitive)
- `AI_GATEWAY_API_KEY` if the project is not using Vercel OIDC for AI Gateway

After the first production domain is known, **update Auth0 callback/logout/CORS** and `APP_BASE_URL` / `AUTH0_AUDIENCE` to match, then redeploy.

Enable **AI Gateway** on the team/project so the chatbot can call `anthropic/claude-sonnet-4.5`.

---

## 7. Smoke test before walking on stage

- [ ] `/` shows Sign in, not “Setup needed”
- [ ] Email/password login and Google login both return to `/book`
- [ ] Add Barnaby, book Full Groom, row appears
- [ ] Chat can book a second visit
- [ ] “Add to calendar” shows the Token Vault card; after connect, event link appears
- [ ] MCP `list_appointments` sees the visit
- [ ] MCP or UI cancel emails CIBA; row still listed; Accept deletes it; Decline leaves it

If CIBA email is missing: user email verified? CIBA grant + email channel on the app? `requested_expiry` 301 (already in code)? Guardian-only tenants will not match this talk.
