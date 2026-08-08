---
name: Nyaya Nagri AI safety gates
description: Shared deterministic safety module contract for ALL AI chat routes (avatar + personas); PII redaction threshold rationale.
---

**Rule:** Every AI chat route (avatar companion, role-play personas, any future one) must reuse the single shared safety module (avatar route's safety file) — never fork it. Gate order: (1) deterministic distress scan over raw message+history → canonical hard-coded escalation, no AI call; (2) PII ingress redaction; (3) untrusted-history quoting; (4) fail-closed output gate replacing any helpline-phrasing reply with canonical text. Reply budget capped at 1024 tokens (2-4 sentence replies; bounds drift).

**Why:** Architect review (Task 17) failed the persona route for prompt-only PII enforcement; fixed with deterministic ingress redaction applied to BOTH routes. Single-sourcing keeps helpline text and gates from drifting apart.

**How to apply:** PII redaction removes emails, @handles, and digit runs of 8+ (incl. Devanagari digits). The 8+ threshold is DELIBERATE — it spares helplines (1098, 155260), ages, "24 hours", and legal section numbers like 12(1)(c). Do not "improve" it to catch shorter runs. Free-form prose PII (names/addresses in words) is prompt-enforced only — an accepted, flagged limitation. Personas/avatar are instructed to never state helpline digits themselves (the output gate would replace the reply); they point to the Get Help Now button instead. Identity-honesty ("not a real judge") is enforced by the always-visible hard-coded UI disclaimer, NOT an output regex — a regex would false-positive on the desirable "I am not a real X".
