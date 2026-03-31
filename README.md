# 🔐 Trustlyx — Production-Ready Authentication Engine

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=200&section=header&text=Trust&fontSize=50&fontColor=ffffff&animation=fadeIn" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/badge/Architecture-Modular-purple?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Auth-MultiTenant-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Security-High-red?style=for-the-badge"/>
</p>

---

## 🧠 What is Trust?

**Trust** is a **modular, multi-tenant authentication engine** designed for real-world production systems.

It provides:

* 🔑 Password auth
* 🔗 Magic links
* 🌐 OAuth (Google)
* 🔁 Token-based sessions
* 🧱 Adapter-based infrastructure
* 🏢 Multi-tenant support (core feature)

---

## ✨ Features

### 🔐 Authentication Methods

* Email + Password
* Magic Link (passwordless)
* Google OAuth

### 🧱 Architecture

* Context-based execution (`AuthContext`)
* Service-layer separation
* Adapter pattern (email, cache)
* Strategy-based auth flows

### 🛡️ Security

* Password hashing (bcrypt)
* Token hashing (SHA-256)
* Brute-force protection
* Rate limiting support
* Refresh token sessions
* One-time magic links

### 🏢 Multi-Tenancy

* Tenant isolation at DB level
* Context-driven tenant resolution

---

## 📦 Project Structure

```
sdk/
│
├── core/
│   ├── Trust.ts
│   ├── context.ts
│   ├── jwt.ts
│
├── services/
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── OAuthService.ts
│   ├── SecurityService.ts
│
├── strategies/
│   ├── magicLink.ts
│   ├── google.ts
│
├── adapters/
│   ├── email/
│   ├── cache/
│
├── models/
│   ├── User.ts
│
```

---

## ⚙️ Installation

```bash
npm install trustylyx
```

---

## 🚀 Quick Start

### 1. Initialize SDK

```ts
import { Trust } from "./sdk";

const sdk = new Trust({
  jwtSecret: "secret",
  refreshSecret: "refresh",
  appUrl: "http://localhost:3000",

  getTenant: (req) => req.headers["x-tenant-id"],

  adapters: {
    email: new MockEmailAdapter(),
    cache: new RedisAdapter(redisClient),
  },

  providers: {
    google: {
      clientId: "...",
      clientSecret: "...",
      redirectUri: "...",
    },
  },
});
```

---

### 2. Create Context (🔥 important)

```ts
const ctx = sdk.createContext(req);
```

---

### 3. Use Services

```ts
const auth = new AuthService(ctx);

await auth.signup(email, password);
await auth.login(email, password);
```

---

### 4. Magic Link

```ts
await sendMagicLink(ctx, email);
await verifyMagicLink(ctx, token);
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

* Eliminates passing `sdk` everywhere
* Injects tenant automatically
* Ensures isolation

---

### 🔹 Adapters

Plug in your own infrastructure:

```ts
email: EmailAdapter
cache: CacheAdapter
```

Examples:

* Resend / SendGrid
* Redis / Memory cache

---

### 🔹 Services vs Strategies

| Layer      | Responsibility                 |
| ---------- | ------------------------------ |
| Services   | Business logic                 |
| Strategies | Auth flows (magic link, OAuth) |

---

## 🔐 Security Design

### ✅ Passwords

* Hashed with bcrypt

### ✅ Tokens

* Stored as SHA-256 hashes

### ✅ Magic Links

* One-time use
* Expire after 15 minutes
* Deleted after verification

### ✅ Brute Force Protection

```ts
await security.recordFailedLogin(email, tenantId);
```

---

## 🔁 Session System

Each user stores:

```ts
refreshTokens: [
  {
    token,
    createdAt,
    expiresAt
  }
]
```

Supports:

* Session tracking
* Expiry validation
* Future: rotation & reuse detection

---

## 🏢 Multi-Tenant Design

Every query is scoped:

```ts
{ email, tenantId }
```

Tenant comes from:

```ts
sdk.getTenant(req)
```

---

## 🧪 Development Mode

Use mock adapters:

```ts
new MockEmailAdapter()
```

Logs emails to console instead of sending.

---

## 🧠 Future Roadmap

* 🔄 Refresh token rotation
* 🚨 Reuse attack detection
* 📧 Email verification flow
* 🔌 Plugin system
* 📊 Audit logs
* 🪝 Hooks system

---

## 🎯 Philosophy

> This is not just an auth system.
> It's an **auth engine**.

* Composable
* Framework-agnostic
* Production-first
* Security-focused

---

## 💡 Inspiration

Built with ideas inspired by:

* Modern SaaS auth systems
* Real-world backend architecture patterns
* Scalable multi-tenant systems

---
### Made By [Dave](https://github.com/davex-ai)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=120&section=footer"/>
</p>
