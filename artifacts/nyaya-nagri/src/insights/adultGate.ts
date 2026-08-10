/**
 * Adult PIN gate — local demo access control for the teacher/parent area.
 *
 * HONEST SCOPE (disclosed in the UI): this prototype is local-first with a
 * single on-device learner and NO accounts, so the adult area is protected
 * by a locally set PIN, not real authentication. The PIN is never stored in
 * plain text — only a random salt + SHA-256 hash (WebCrypto) in
 * localStorage — and a successful unlock lasts for the browser session
 * (sessionStorage flag). A production multi-user deployment would replace
 * this with real server-side accounts and role-based access control.
 *
 * The gate deliberately does NOT touch the child's progress data: clearing
 * or resetting the PIN never deletes any learning history.
 */

const PIN_KEY = 'nn-adult-pin-v1';
const UNLOCK_KEY = 'nn-adult-unlocked';

interface StoredPin {
  v: 1;
  salt: string;
  hash: string;
}

/** 4-6 digits — simple enough for a demo, never sent anywhere. */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

function readStored(): StoredPin | null {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPin>;
    if (parsed && parsed.v === 1 && typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return parsed as StoredPin;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasPin(): boolean {
  return readStored() !== null;
}

export async function setPin(pin: string): Promise<boolean> {
  if (!isValidPinFormat(pin)) return false;
  try {
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const salt = toHex(saltBytes);
    const hash = await sha256Hex(`${salt}:${pin}`);
    localStorage.setItem(PIN_KEY, JSON.stringify({ v: 1, salt, hash } satisfies StoredPin));
    return true;
  } catch {
    return false;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = readStored();
  if (!stored || !isValidPinFormat(pin)) return false;
  try {
    return (await sha256Hex(`${stored.salt}:${pin}`)) === stored.hash;
  } catch {
    return false;
  }
}

export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function markUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK_KEY, '1');
  } catch {
    // Session-only convenience flag; failing silently just re-asks the PIN.
  }
}

export function lockNow(): void {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // ignore
  }
}

/** Forget the PIN (child's learning data is untouched by design). */
export function clearPin(): void {
  try {
    localStorage.removeItem(PIN_KEY);
  } catch {
    // ignore
  }
  lockNow();
}
