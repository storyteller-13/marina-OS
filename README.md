## 👾 marina OS

<br>

- **[CLAUDE.md](CLAUDE.md)**: architecture notes for Claude Code.
- **[CODEX.md](CODEX.md)**: architecture + workflow notes for Codex.

## 🔐 security missions

- Keep strict security headers configured in `vercel.json`.
- Keep secrets out of client-side code and use server-side env vars.
- Route production API requests through same-origin `/api/*` proxies.
- Maintain security tests (especially `tests/vercel-security-headers.test.js`).

- start the local development server at **[`localhost:8088`](http://localhost:8088)**:

<br>

```bash
make server
```

<br>
