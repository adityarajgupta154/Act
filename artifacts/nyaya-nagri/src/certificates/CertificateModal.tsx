/**
 * Nyaya Nagri — certificate viewer + PDF download (Task 27).
 *
 * A deliberately NON-game overlay: dark neutral backdrop, the certificate
 * floating as real paper, professional controls. Desktop shows it large;
 * small screens scale it to width (the page pinch-zoom still works).
 *
 * Download pipeline (client-side, print-quality):
 *   html2canvas rasterizes an OFFSCREEN, natural-size copy of the document
 *   (capturing the scaled preview would bake the on-screen transform into
 *   the bitmap), then jsPDF places it full-bleed on a landscape A4 page —
 *   the document's 1123x794 ratio IS the A4 297x210mm ratio. Both libs are
 *   dynamically imported so the game bundle never pays for them until the
 *   child actually downloads.
 *
 * §9.4: the recipient line is the live game nickname (or a friendly
 * fallback) — read at render time, never stored with the record.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CertificateDoc, CERT_WIDTH, CERT_HEIGHT } from './CertificateDoc';
import {
  certificateFileName,
  certificateRecipient,
  formatCertificateDate,
} from './certificates';
import { progressStore } from '@/data/progressStore';
import { getZone } from '@/world/zones';
import { useUIStore, closeCertificate } from '@/ui/uiStore';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { X, Download } from 'lucide-react';

export function CertificateModal({
  zoneId,
  onClose,
}: {
  zoneId: string;
  onClose: () => void;
}) {
  const t = useStrings();
  const { language } = useSettings();
  const [progress, setProgress] = useState(() => progressStore.getState());
  useEffect(() => progressStore.subscribe(setProgress), []);

  const record = progress.certificates[zoneId];
  const zone = getZone(zoneId);

  const frameRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setScale(Math.min(rect.width / CERT_WIDTH, rect.height / CERT_HEIGHT, 1));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const onDownload = useCallback(async () => {
    if (!record || !zone || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      // Serif faces must be in before rasterizing, or the PDF falls back.
      // Architect round: explicitly load the certificate faces (including
      // the Devanagari ones Hindi uses) before capture - html2canvas draws
      // whatever glyphs the DOM currently shows, and fonts.ready alone does
      // not force lazily-loaded web fonts nothing on-page has used yet.
      await Promise.all(
        [
          "700 41px 'Playfair Display'",
          "600 30px 'Playfair Display'",
          "700 30px 'Noto Serif Devanagari'",
          "700 15px 'Noto Sans Devanagari'",
          "700 15px Nunito",
        ].map((face) => document.fonts.load(face)),
      ).catch(() => undefined);
      await document.fonts.ready;
      const [html2canvasMod, jspdfMod] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const node = captureRef.current;
      if (!node) throw new Error('certificate capture node missing');
      const canvas = await html2canvasMod.default(node, {
        scale: 2.2, // ~2470px wide → crisp at print size
        backgroundColor: '#FDFBF6',
        useCORS: true,
        logging: false,
      });
      const pdf = new jspdfMod.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 297, 210);
      pdf.save(certificateFileName(zone.name));
    } catch (err) {
      // Explicit failure, never silent — the child sees a retry line.
      console.error('[certificate] download failed', err);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [record, zone, busy]);

  // §14: no real completion record → nothing to show, ever.
  if (!record || !zone) return null;

  const docProps = {
    zoneName: t.zones[zoneId]?.name ?? zone.name,
    recipientName: certificateRecipient(progress.avatar?.nickname, t.certRecipientFallback),
    dateText: formatCertificateDate(record.completedAt, language),
    certificateId: record.certificateId,
    t,
  };

  return (
    <div
      className="absolute inset-0 z-40 pointer-events-auto bg-slate-900/85 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t.certificateOfCompletion}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-3 md:py-4 shrink-0">
        <div className="min-w-0">
          <p className="text-white font-display font-bold text-lg md:text-xl leading-tight truncate">
            {docProps.zoneName}
          </p>
          <p className="text-slate-300 text-xs md:text-sm font-medium">
            {t.certificateOfCompletion}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label={t.certificateClose}
          className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors touch-manipulation shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Certificate, scaled to fit the available frame */}
      <div
        ref={frameRef}
        className="flex-1 min-h-0 px-4 md:px-10 flex items-center justify-center overflow-auto"
      >
        <div
          style={{
            width: CERT_WIDTH * scale,
            height: CERT_HEIGHT * scale,
            position: 'relative',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.55)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: CERT_WIDTH,
              height: CERT_HEIGHT,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <CertificateDoc {...docProps} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 py-4 md:py-5 flex flex-col items-center gap-2">
        {failed && (
          <p className="text-amber-300 text-sm font-bold">{t.certificateDownloadFailed}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onDownload}
            disabled={busy}
            className="bg-[#C9A227] hover:bg-[#B5901F] disabled:opacity-60 text-slate-900 px-6 py-3 rounded-full font-bold text-base transition-colors flex items-center gap-2 touch-manipulation"
          >
            <Download className="w-5 h-5" />
            {busy ? t.certificateDownloading : t.downloadCertificate}
          </button>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold text-base transition-colors touch-manipulation"
          >
            {t.certificateClose}
          </button>
        </div>
      </div>

      {/* Offscreen natural-size copy for capture (html2canvas must never
          see the preview's CSS transform) */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}
      >
        <div ref={captureRef}>
          <CertificateDoc {...docProps} />
        </div>
      </div>
    </div>
  );
}

/**
 * Global mount driven by uiStore — the SAME viewer opens from My Progress
 * cards and from the zone-complete celebration.
 */
export function CertificateOverlay() {
  const { certificateZoneId } = useUIStore();
  if (!certificateZoneId) return null;
  return <CertificateModal zoneId={certificateZoneId} onClose={closeCertificate} />;
}
