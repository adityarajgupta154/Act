/**
 * Coarse phone-vs-desktop split for the Get Help Now hub (task §8): on a
 * phone, Call buttons are real tel: links (native dialer); on desktop,
 * tel: is usually a dead end, so the card shows the number and copies it
 * on tap instead. This is a UX hint only — never a security boundary.
 */
export function isPhoneLike(): boolean {
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (typeof uaData?.mobile === 'boolean') return uaData.mobile;
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}
