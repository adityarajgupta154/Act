---
name: Workspace lib d.ts staleness
description: Why new exports from a lib/ package give TS2305 in consumers until the lib's declarations are regenerated
---

**Rule:** after ADDING exports to a `lib/*` workspace package, regenerate its
declarations with `pnpm exec tsc -p lib/<name>` before typechecking consumers.

**Why:** the libs are TypeScript **composite** projects with
`emitDeclarationOnly` → `dist/*.d.ts`, and consumers (e.g. the api-server)
list them in `references`. Plain `tsc --noEmit` in the consumer resolves the
lib through its **built** `dist` declarations, not `src` — even though the
package.json `exports` points at `./src/index.ts` (that path serves the
runtime/esbuild, which is why the server can RUN new code while tsc still
reports `TS2305: no exported member`). The stale types also cascade into
bogus `TS7006` implicit-any errors at the call sites (unresolved import ⇒
`any` callee ⇒ untyped callback params), which vanish with the same rebuild.

**How to apply:** on any TS2305 for a `@workspace/*` import you just added,
don't touch the consumer — rebuild the lib's declarations first
(`pnpm exec tsc -p lib/<name>`), then re-run the consumer's `tsc --noEmit`.
(Project rule elsewhere: never use `tsc -b` for typechecking; `-p` on the
lib for EMIT is the sanctioned regeneration path.)
