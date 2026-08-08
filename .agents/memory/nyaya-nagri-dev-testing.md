---
name: Nyaya Nagri dev testing
description: How to curl-test the api-server in development; proxy path does not work.
---

**Rule:** To curl-test `/api/avatar/chat` in development, hit the api-server directly on its own port (read `PORT=` from the workflow process env, e.g. `http://localhost:8080/api/avatar/chat`). The shared preview proxy path (`http://localhost:80/api-server/...`) returns 404 for this service.

**Why:** Cost several probing steps in the Task 10 session; the Express app mounts routes at `/api` with no artifact base-path prefix, so proxied paths don't match.

**How to apply:** `PID=$(pgrep -f "api-server.*run dev")` → read `/proc/<child>/environ` for `PORT`, or check the workflow log ("Server listening, port: NNNN"), then curl `localhost:<port>/api/...`.

**Also:** The avatar output gate is fail-closed by design — any model reply that phrases helpline guidance (digits, "childline", "हेल्पलाइन", "कॉल करो", etc.) is replaced with the canonical escalation reply. A model answer to "पॉक्सो क्या है?" that volunteers 1098 gets replaced; this is intentional, not a bug.
