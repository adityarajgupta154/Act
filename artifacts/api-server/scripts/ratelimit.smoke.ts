/**
 * Rate-limiter smoke — deterministic policy tests (injected clock, no
 * network) + wiring asserts for the expensive Sarvam voice route.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRateLimiter } from '../src/routes/nyayaai/rateLimit';

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? '  ok ' : 'FAIL '} ${name}`);
  if (!cond) failures += 1;
}

// ---- policy: per-key burst then refill ----
{
  const lim = createRateLimiter({ perKeyCapacity: 3, perKeyRefillPerMinute: 6, globalPerMinute: 100 });
  const t0 = 1_000_000;
  check(
    'burst allowed up to capacity, then shed',
    lim.allow('a', t0) && lim.allow('a', t0) && lim.allow('a', t0) && !lim.allow('a', t0),
  );
  check('refill grants exactly the earned token (1 per 10s at 6/min)',
    lim.allow('a', t0 + 10_000) && !lim.allow('a', t0 + 10_000));
  check('keys are isolated (b unaffected by a exhausting itself)', lim.allow('b', t0 + 10_000));
}

// ---- policy: global ceiling across keys ----
{
  const lim = createRateLimiter({ perKeyCapacity: 5, perKeyRefillPerMinute: 5, globalPerMinute: 4 });
  const t0 = 5_000_000;
  const first4 = ['k1', 'k2', 'k3', 'k4'].every((k) => lim.allow(k, t0));
  check('global per-minute ceiling sheds even fresh keys', first4 && !lim.allow('k5', t0));
  check('global window resets after a minute', lim.allow('k5', t0 + 60_001));
}

// ---- wiring: admission is mounted at the APP layer, before the parser ----
const HERE = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(join(HERE, '../src/routes/nyayaai/sarvam-voice.ts'), 'utf8');
const limiterSrc = readFileSync(join(HERE, '../src/routes/nyayaai/rateLimit.ts'), 'utf8');
const appSrc = readFileSync(join(HERE, '../src/app.ts'), 'utf8');
check('voice limiter + admission middleware live in rateLimit.ts',
  limiterSrc.includes('export const voiceLimiter = createRateLimiter({') &&
    limiterSrc.includes('export function voiceAdmission(') &&
    limiterSrc.includes('res.status(429)'));
check(
  'admission mounts BEFORE express.json — shed posts never pay the 5MB parse',
  appSrc.indexOf('voiceAdmission') > 0 &&
    appSrc.indexOf('app.use("/api/nyaya-ai/sarvam-voice", voiceAdmission)') <
      appSrc.indexOf('express.json('),
);
check(
  'trust proxy is set so req.ip keys the CLIENT, not the proxy peer',
  appSrc.includes('app.set("trust proxy", 1)'),
);
check(
  'route itself holds no limiter call (single admission point, no double-charge)',
  !route.includes('voiceLimiter.allow('),
);
check(
  'strict runtime bounds: audio size, language enum, history shape AND content length',
  route.includes('res.status(413)') &&
    route.includes('language must be en|hi') &&
    route.includes('malformed history') &&
    route.includes('t.content.length > 2_000') &&
    route.includes('> 16_000'),
);

if (failures > 0) {
  console.error(`\n${failures} ratelimit smoke check(s) FAILED`);
  process.exit(1);
}
console.log('\nAll ratelimit smoke checks passed.');
