# 🔐 Trustlyx — Production-Ready Authentication Engine

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=200&section=header&text=Trustlyx&fontSize=50&fontColor=ffffff&animation=fadeIn" />
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/trustlyx?style=for-the-badge&color=cb3837&logo=npm"/>
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/badge/Architecture-Modular-purple?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Auth-MultiTenant-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/OAuth-Google%20%7C%20GitHub-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Security-High-red?style=for-the-badge"/>
  <img src="https://img.shields.io/npm/l/trustlyx?style=for-the-badge"/>
</p>

---

## 🧠 What is Trustlyx?

**Trustlyx** is a **modular, multi-tenant authentication engine** for real-world production systems.

It provides:

* 🔑 Password auth, with email verification enforced before login
* 🔗 Passwordless magic links
* 🌐 OAuth — Google and GitHub, with a strategy pattern for adding more
* 🔁 Rotating refresh token sessions
* 🧱 Adapter-based infrastructure — bring your own email sender, cache, and datastore
* 🪝 Lifecycle hooks (`onUserCreated`, `onLogin`)
* 🏢 Multi-tenant support as a core, first-class concept
* 🛡️ Brute-force lockout, password hashing, token hashing

---

## ✨ Features

### 🔐 Authentication Methods

* Email + Password, gated behind email verification
* Magic Link (passwordless) — issues a full session on verify, same as password login
* Google OAuth
* GitHub OAuth (handles private-email accounts via the GitHub emails API)

### 🧱 Architecture

* Context-based execution (`AuthContext`) — carries `sdk` + resolved `tenantId` through every call
* Service-layer separation (`AuthService`, `OAuthService`, `SecurityService`)
* Adapter pattern for **email**, **cache**, and **user storage** — the SDK never talks to a database directly
* Provider/strategy pattern for OAuth — each provider (`GoogleProvider`, `GithubProvider`) is a standalone class implementing one shared interface

### 🛡️ Security

* Password hashing (bcrypt)
* Token hashing (SHA-256) — raw tokens are never stored, only their hashes
* Brute-force protection — 5 failed attempts locks out an email/tenant pair for 15 minutes
* Refresh token **rotation** — every refresh issues a new token and invalidates the one used to request it
* One-time, time-limited magic links and verification tokens

### 🏢 Multi-Tenancy

* Every user lookup and mutation is scoped by `tenantId`
* Tenant resolved per-request via `sdk.getTenant(req)`, which you configure
* Two users can share the same email across different tenants without colliding

### 🪝 Hooks

* `onUserCreated(user)` — fires once, the moment a user is first created, across every signup path (password, passwordless, OAuth)
* `onLogin(user)` — fires on a real authentication event (password login, magic link verification, OAuth login). Does **not** fire on token refresh — a refresh isn't a new authentication, so it's kept out of the login hook to avoid noisy/misleading events in analytics or notification hooks built on top of it

---

## 📦 Project Structure

```
src/
│
├── core/
│   ├── config.ts             # AuthConfig + AuthSDK
│   ├── context.ts            # AuthContext — carries sdk + tenantId
│   ├── jwt.ts                # JWTService
│   ├── emailVerification.ts  # token generation + hashing helpers
│
├── services/
│   ├── auth.service.ts       # signup / verifyEmail / login / refresh
│   ├── user.service.ts       # thin read-only wrapper over userAdapter
│   ├── oauth.ts               # OAuthService — provider registry + login handling
│   ├── security.service.ts   # password hashing + brute-force lockout
│   ├── provider.interface.ts # OAuthProvider / OAuthProviderHandler types
│
├── strategies/
│   ├── magicLink.ts          # sendMagicLink / verifyMagicLink
│   ├── google.ts              # GoogleProvider
│   ├── github.ts              # GithubProvider
│
├── adapters/
│   ├── types.ts               # EmailAdapter / CacheAdapter interfaces
│   ├── useradapter.ts         # UserAdapter interface — implement this for any DB
│   ├── mongoose.adapter.ts    # MongooseUserAdapter — default implementation
│   ├── redis.adapter.ts
│   ├── resend.adapter.ts
│   ├── smtp.adapter.ts
│   ├── mockEmail.adapter.ts   # logs to console instead of sending — for local dev
│
├── models/
│   ├── user.model.ts          # Mongoose schema backing MongooseUserAdapter
│
├── middleware/
│   ├── protect.ts             # Express middleware, verifies access token
```

---

## ⚙️ Installation

```bash
npm install trustlyx
```

---

## 🚀 Quick Start

### 1. Initialize the SDK

```ts
import {
  AuthSDK,
  MongooseUserAdapter,
  ResendAdapter,
  RedisAdapter,
} from "trustlyx";

const sdk = new AuthSDK({
  jwtSecret: process.env.JWT_SECRET!,
  refreshSecret: process.env.REFRESH_SECRET!,
  appUrl: "http://localhost:3000",

  // Required — the SDK never touches a database directly.
  // Use the built-in MongooseUserAdapter, or implement UserAdapter
  // yourself for any other datastore.
  userAdapter: new MongooseUserAdapter(),

  adapters: {
    email: new ResendAdapter(process.env.RESEND_API_KEY!, "no-reply@yourdomain.com"),
    cache: new RedisAdapter(redisClient), // optional — powers brute-force lockout
  },

  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/google/callback",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/github/callback",
    },
  },

  hooks: {
    onUserCreated: (user) => console.log("New user:", user.email),
    onLogin: (user) => console.log("Login:", user.email),
  },

  getTenant: (req) => req.headers["x-tenant-id"] || "default",
});
```

### 2. Create a context per request

```ts
const ctx = sdk.createContext(req);
```

This resolves `tenantId` via your `getTenant` function and gives you a scoped `AuthContext` — every auth operation for this request should go through `ctx`, not `sdk` directly.

### 3. Password auth

```ts
await ctx.auth.signup(email, password);   // sends a verification email, returns unverified user
await ctx.auth.verifyEmail(token);        // marks the user verified
await ctx.auth.login(email, password);    // returns { accessToken, refreshToken }
await ctx.auth.refresh(refreshToken);     // rotates the session, returns a new pair
```

### 4. Passwordless (magic link)

```ts
import { sendMagicLink, verifyMagicLink } from "trustlyx";

await sendMagicLink(ctx, email);            // sends a login link, creates the user if new
await verifyMagicLink(ctx, token);          // returns { accessToken, refreshToken }
```

### 5. OAuth (Google / GitHub)

```ts
// redirect the browser here — this cannot be done via a plain API call,
// it requires an interactive consent screen
res.redirect(sdk.oauth.getAuthUrl("google")); // or "github"

// in your callback route
const result = await sdk.oauth.handleOAuthLogin(
  "google", // or "github"
  req.query.code as string,
  ctx.tenantId
);
// result: { accessToken, refreshToken, user }
```

---

## 🧩 Core Concepts

### 🔹 AuthContext

```ts
{
  sdk,
  tenantId
}
```

* Resolves and carries the current tenant for you
* Exposes `.auth` — a lazily-constructed `AuthService` scoped to this context
* Every password-auth operation should go through `ctx.auth`, not a manually constructed `AuthService`

### 🔹 Adapters

Trustlyx never talks to a database, email provider, or cache directly — everything goes through an adapter you configure.

| Adapter | Interface | Built-in implementations |
|---|---|---|
| Email | `EmailAdapter` | `ResendAdapter`, `SmtpAdapter`, `MockEmailAdapter` (console logging, for dev) |
| Cache | `CacheAdapter` | `RedisAdapter` |
| User storage | `UserAdapter` | `MongooseUserAdapter` |

`userAdapter` is the one required adapter — everything else is optional. To back Trustlyx with a different database (Postgres, DynamoDB, etc.), implement `UserAdapter`:

```ts
interface UserAdapter {
  findById(id: string): Promise<any>;
  findByEmail(email: string, tenantId: string): Promise<any>;
  create(user: Partial<{ email; password; tenantId; verified; provider }>): Promise<any>;
  update(id: string, data: any): Promise<any>;

  addVerificationToken(userId: string, token: { token: string; expiresAt: Date }): Promise<any>;
  findByVerificationToken(hashedToken: string, tenantId: string): Promise<any>;
  removeVerificationToken(userId: string, hashedToken: string): Promise<any>;

  addSession(userId: string, session: { token; createdAt; expiresAt; used }): Promise<any>;
  findSession(userId: string, hashedToken: string): Promise<any>;
  markSessionUsed(userId: string, hashedToken: string): Promise<any>;
}
```

> Every method that returns a user object **must** include a normalized `id: string` field, regardless of your database's native id shape (Mongo `_id`, Postgres serial, etc). `MongooseUserAdapter` handles this for you automatically.

### 🔹 OAuth providers

Each provider is a standalone class implementing `OAuthProviderHandler`:

```ts
interface OAuthProviderHandler {
  getAuthUrl(): string;
  getUser(code: string): Promise<{ email: string; name?: string; avatar?: string }>;
}
```

`OAuthService` is a thin registry over these — adding a new provider (Apple, Facebook, etc.) means writing one new class and registering it, without touching any existing provider's code.

---

## 🔐 Security Design

### ✅ Passwords
Hashed with bcrypt. Never stored or logged in plaintext.

### ✅ Tokens
Verification tokens, magic link tokens, and refresh tokens are all stored as SHA-256 hashes — the raw token only ever exists in the email/response sent to the user.

### ✅ Refresh sessions
Every call to `refresh()` issues a brand new refresh token and marks the one used to call it as spent. Reusing a refresh token after it's been rotated fails with `"Invalid session"`.

### ✅ Magic links
One-time use, expire after 15 minutes, deleted from storage immediately after verification.

### ✅ Brute-force protection
```ts
await sdk.security.isLockedOut(email, tenantId);
```
Five failed password attempts locks that email/tenant pair out for 15 minutes. This is checked automatically inside `login()` — you don't need to call it yourself.

---

## 🏢 Multi-Tenant Design

Every query is scoped by tenant:

```ts
{ email, tenantId }
```

`tenantId` is resolved once per request via your `getTenant` function and carried through `AuthContext` for the rest of that request's lifecycle. Two users with the same email in different tenants are entirely independent accounts.

---

## 🧪 Development Mode

```ts
adapters: {
  email: new MockEmailAdapter(),
}
```

Logs every outgoing email to the console instead of sending it — useful for grabbing verification/magic-link tokens directly during local testing, without needing a real inbox.

---

## 🧠 Roadmap

* 🍎 Apple OAuth
* 📘 Facebook OAuth
* 🚨 Refresh token reuse-attack detection (flagging and revoking all sessions if a rotated-out token is replayed)
* 🔌 Broader plugin system beyond `hooks`
* 📊 Structured audit logging

---

## 🎯 Philosophy

> This is not just an auth system.
> It's an **auth engine**.

* Composable
* Framework-agnostic
* Production-first
* Security-focused

---

### Made By [Dave](https://github.com/davex-ai)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=120&section=footer"/>
</p>