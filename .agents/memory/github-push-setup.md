---
name: GitHub push setup for this project
description: How to push to the user's GitHub repo — which credential path works, which are dead ends
---

**The rule:** Push to `origin` (URL: see `git remote -v`) using the secret env var `$GITHUB_PERSONAL_ACCESS_TOKEN` as the password with username `x-access-token`, via a one-shot credential helper. Never echo the token, never embed it in the remote URL or any file:

```bash
H='!f() { echo username=x-access-token; echo password=$GITHUB_PERSONAL_ACCESS_TOKEN; }; f'
git -c credential.helper= -c credential.helper="$H" push origin main
```

`$ACT` is a known-good backup secret if the primary ever 403s.

**Why:**
- The Replit GitHub *connection* is linked to a different account than the repo owner, and that connected account has no write access to this repo — so the platform `gitPush` callback fails with an opaque `CLI_ERROR ... UNKNOWN`. Do not use `gitPush` here; the user chose the token route over adding the connected account as a collaborator.
- GitHub fine-grained PAT trap: the default scope "Public repositories (read-only)" produces tokens that authenticate fine but cannot push — verify write access (e.g. a dry-run push or the API) before assuming a new token works.

**How to apply:** For any future "push kr do" request: commit on `main`, run the credential-helper push above, verify `git ls-remote origin refs/heads/main` SHA == local HEAD. On 403, the token has likely expired or lost scope — request a fresh one via the secure secrets form (the user tends to paste tokens in chat; redirect to the form and remind them to revoke any chat-pasted token).
