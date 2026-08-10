/**
 * Nyaya Nagri — the certificate document itself (Task 27).
 *
 * A fixed-size (A4 landscape, 1123x794 @ 96dpi) print-ready certificate.
 * Deliberately NOT game-styled: ivory paper, navy + gold identity, serif
 * typography — premium educational certificate, while the JusticeCrest
 * keeps it unmistakably Nyaya Nagri.
 *
 * Every colour is an inline HEX style on purpose: the download pipeline
 * rasterizes this exact DOM with html2canvas, which cannot parse the
 * oklch() colours Tailwind v4 emits — so this subtree must never rely on
 * Tailwind colour classes or CSS variables.
 *
 * Pure and prop-driven (renderable by smoke tests via react-dom/server).
 * No PII: the recipient is always the live game nickname (PRD §9.4).
 */
import React from 'react';
import { JusticeCrest } from '@/ui/JusticeCrest';
import type { UIStrings } from '@/i18n/strings';

export const CERT_WIDTH = 1123;
export const CERT_HEIGHT = 794;

const NAVY = '#14306E';
const NAVY_SOFT = '#2F66C9';
const GOLD = '#C9A227';
const GOLD_DEEP = '#B57D1F';
const GOLD_PALE = '#E7CE8F';
const INK = '#1F2937';
const MUTED = '#64748B';
const FAINT = '#94A3B8';
const PAPER = '#FDFBF6';

const SERIF = "'Playfair Display', 'Noto Serif Devanagari', Georgia, 'Times New Roman', serif";
const SANS = "'Nunito', 'Noto Sans Devanagari', 'Segoe UI', sans-serif";

function Corner({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: flipY ? undefined : 34,
        bottom: flipY ? 34 : undefined,
        left: flipX ? undefined : 34,
        right: flipX ? 34 : undefined,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
      }}
    >
      <path d="M2 70 V16 Q2 2 16 2 H70" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <path d="M11 70 V22 Q11 11 22 11 H70" fill="none" stroke={GOLD_PALE} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="2.6" fill={GOLD_DEEP} />
    </svg>
  );
}

export interface CertificateDocProps {
  /** Localized zone/course name shown as the course line. */
  zoneName: string;
  /** Live game nickname (never a real name) or the friendly fallback. */
  recipientName: string;
  /** Pre-formatted long date, e.g. "10 August 2026". */
  dateText: string;
  /** Stable certificate id, e.g. "NYN-SCH-2026-A8F42C". */
  certificateId: string;
  /** String bundle of the language the certificate renders in. */
  t: UIStrings;
}

export function CertificateDoc({
  zoneName,
  recipientName,
  dateText,
  certificateId,
  t,
}: CertificateDocProps) {
  return (
    <div
      data-testid="certificate-doc"
      role="img"
      aria-label={`${t.certificateOfCompletion} — ${recipientName} — ${zoneName}`}
      style={{
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        background: PAPER,
        position: 'relative',
        fontFamily: SANS,
        color: INK,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Paper frame: outer gold rule + inner hairline */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 22,
          border: `2.5px solid ${GOLD_DEEP}`,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 30,
          border: `1px solid ${GOLD_PALE}`,
          pointerEvents: 'none',
        }}
      />
      <Corner />
      <Corner flipX />
      <Corner flipY />
      <Corner flipX flipY />

      {/* Watermark crest — very faint, centered */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.045,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: 360, height: 418 }}>
          <JusticeCrest className="h-full w-full" />
        </div>
      </div>

      {/* Content column */}
      <div
        style={{
          position: 'absolute',
          inset: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '38px 84px 34px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Brand header */}
        <div style={{ width: 58, height: 67, position: 'relative', zIndex: 1 }}>
          <JusticeCrest className="h-full w-full" />
        </div>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 21,
            letterSpacing: 7,
            color: NAVY,
          }}
        >
          {t.certBrandName}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 10.5,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: MUTED,
            fontWeight: 700,
          }}
        >
          {t.certBrandTagline}
        </p>

        <div
          aria-hidden="true"
          style={{
            width: 190,
            height: 2,
            margin: '16px 0 20px',
            background: `linear-gradient(90deg, transparent, ${GOLD} 22%, ${GOLD} 78%, transparent)`,
          }}
        />

        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 41,
            letterSpacing: 2.5,
            color: NAVY,
            textTransform: 'uppercase',
          }}
        >
          {t.certificateOfCompletion}
        </h1>

        {/* Recipient */}
        <p
          style={{
            margin: '22px 0 0',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: FAINT,
            fontWeight: 700,
          }}
        >
          {t.certPresentedTo}
        </p>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 47,
            lineHeight: 1.15,
            color: NAVY_SOFT,
            maxWidth: 760,
            overflowWrap: 'anywhere',
          }}
        >
          {recipientName}
        </p>
        <div
          aria-hidden="true"
          style={{
            width: 300,
            height: 1.5,
            marginTop: 10,
            background: `linear-gradient(90deg, transparent, ${GOLD} 18%, ${GOLD} 82%, transparent)`,
          }}
        />

        {/* Course */}
        <p
          style={{
            margin: '18px 0 0',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: FAINT,
            fontWeight: 700,
          }}
        >
          {t.certForCompleting}
        </p>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 30,
            color: NAVY,
          }}
        >
          {zoneName}
        </p>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 13.5,
            lineHeight: 1.65,
            color: MUTED,
            maxWidth: 640,
            fontWeight: 500,
          }}
        >
          {t.certBodyLine}
        </p>

        {/* Footer: date + id | seal | signature */}
        <div
          style={{
            marginTop: 'auto',
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ textAlign: 'left', minWidth: 240 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: FAINT,
                fontWeight: 700,
              }}
            >
              {t.certCompletedOnLabel}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 700, color: INK }}>
              {dateText}
            </p>
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: FAINT,
                fontWeight: 700,
              }}
            >
              {t.certIdLabel}
            </p>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: INK,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {certificateId}
            </p>
          </div>

          {/* Seal */}
          <div
            aria-hidden="true"
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              border: `2.5px solid ${GOLD}`,
              background: '#FFFDF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 0 4px ${PAPER}, 0 0 0 5px ${GOLD_PALE}`,
              flexShrink: 0,
            }}
          >
            <div style={{ width: 58, height: 67 }}>
              <JusticeCrest className="h-full w-full" />
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: 240 }}>
            <p
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 26,
                color: NAVY,
              }}
            >
              {t.certBrandName === 'NYAYA NAGRI' ? 'Nyaya Nagri' : t.certBrandName}
            </p>
            <div
              aria-hidden="true"
              style={{ width: 210, height: 1, background: FAINT, margin: '6px auto 6px' }}
            />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: INK }}>
              {t.certBrandName === 'NYAYA NAGRI' ? 'Nyaya Nagri' : t.certBrandName}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: MUTED, fontWeight: 600 }}>
              {t.certBrandTagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
