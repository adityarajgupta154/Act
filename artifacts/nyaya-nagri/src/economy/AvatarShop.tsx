/**
 * Nyaya Nagri — Avatar Shop overlay (Task 16, PRD §7.3 + §9.6)
 *
 * Cosmetic-ONLY shop: Coins earned by finishing levels buy avatar
 * accessories and nothing else — no gameplay advantage, no content
 * access, zero pay-to-win. There is NO real-money path: no prices in
 * rupees, no purchase links, no "get more coins" offer of any kind, and
 * the copy says so explicitly on screen. Buying uses a gentle two-tap
 * confirm so a child cannot spend Coins by accident.
 */
import React, { useEffect, useState } from 'react';
import { X, Coins, ShieldCheck, Check } from 'lucide-react';

import { SHOP_ITEMS } from './economy';
import {
  ACCESSORIES,
  createDefaultAvatar,
  sanitizeAvatar,
  type Accessory,
} from '@/player/avatarConfig';
import { PlayerAvatar } from '@/player/PlayerAvatar';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { closeShop, useUIStore } from '@/ui/uiStore';
import { cn } from '@/lib/utils';

function useProgress() {
  const [state, setState] = useState(() => progressStore.getState());
  useEffect(() => progressStore.subscribe(setState), []);
  return state;
}

export function AvatarShopOverlay() {
  const { shopOpen } = useUIStore();
  const t = useStrings();
  const progress = useProgress();
  const [confirming, setConfirming] = useState<Accessory | null>(null);

  useEffect(() => {
    if (!shopOpen) return;
    setConfirming(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shopOpen]);

  if (!shopOpen) return null;

  // Preview each item on the child's OWN avatar (or a default fallback).
  const baseConfig = sanitizeAvatar(progress.avatar) ?? createDefaultAvatar();
  const anyOwned = progress.ownedAccessories.length > 0;

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display font-bold text-2xl text-slate-800">{t.avatarShopTitle}</h2>
          <button
            onClick={closeShop}
            aria-label={t.cancel}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coin balance — in-game currency only */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full mb-3">
          <Coins className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-700">{t.coinsChip(progress.coins)}</span>
        </div>

        <p className="text-sm text-slate-600 font-medium mb-2">{t.shopIntro}</p>
        <p className="text-sm text-green-700 font-bold mb-5 flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          {t.shopNoRealMoney}
        </p>

        <ul className="flex flex-col gap-3">
          {SHOP_ITEMS.map((item) => {
            const name = t.accessoryNames[ACCESSORIES.indexOf(item.id)] ?? item.id;
            const owned = progress.ownedAccessories.includes(item.id);
            const affordable = progress.coins >= item.price;
            const isConfirming = confirming === item.id;
            return (
              <li
                key={item.id}
                className={cn(
                  'rounded-2xl border-2 p-4',
                  owned ? 'bg-green-50 border-green-100' : 'bg-sky-50 border-sky-100',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    <PlayerAvatar
                      config={{ ...baseConfig, accessories: [item.id] }}
                      size={56}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-lg text-slate-800 leading-tight">
                      {name}
                    </p>
                    <p className="text-sm font-bold text-amber-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {t.coinPrice(item.price)}
                    </p>
                  </div>
                  {owned ? (
                    <span className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm shrink-0">
                      <Check className="w-4 h-4" />
                      {t.shopOwned}
                    </span>
                  ) : (
                    !isConfirming && (
                      <button
                        onClick={() => affordable && setConfirming(item.id)}
                        disabled={!affordable}
                        className={cn(
                          'px-5 py-2.5 rounded-full font-bold text-sm shrink-0 transition-transform active:scale-95 touch-manipulation',
                          affordable
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        {t.shopBuy}
                      </button>
                    )
                  )}
                </div>

                {/* Gentle no — never pressure, just point back to play */}
                {!owned && !affordable && (
                  <p className="text-sm text-slate-500 font-medium mt-2">{t.shopNotEnough}</p>
                )}

                {/* Two-tap confirm so Coins are never spent by accident */}
                {isConfirming && !owned && (
                  <div className="mt-3 bg-white rounded-xl border border-orange-200 p-3">
                    <p className="font-bold text-slate-700 mb-2">
                      {t.shopConfirm(name, item.price)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          progressStore.purchaseAccessory(item.id);
                          setConfirming(null);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-sm transition-transform active:scale-95 touch-manipulation"
                      >
                        {t.shopYesBuy}
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-sm transition-transform active:scale-95 touch-manipulation"
                      >
                        {t.shopNotNow}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {anyOwned && (
          <p className="text-sm text-slate-500 font-medium mt-4">{t.shopEquipHint}</p>
        )}
      </div>
    </div>
  );
}
