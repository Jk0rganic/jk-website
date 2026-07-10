import { create } from "zustand";
import { persist } from "zustand/middleware";

// Once shown, don't show again for this long — long enough to not annoy a
// same-day repeat visitor, short enough that the spotlight rotates in new
// picks on their next real visit.
export const SPOTLIGHT_COOLDOWN_MS = 20 * 60 * 60 * 1000;

// After a visitor has been shown every escalation stage without engaging,
// back off for a month instead of nagging them daily.
export const SPOTLIGHT_LONG_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

// Stage escalates each time the popup is shown without a click: a plain
// intro, then social proof, then (genuine, stock-based) urgency. Beyond this
// stage the popup only opens on exit-intent, then goes quiet for a month.
export const MAX_SPOTLIGHT_STAGE = 4;

interface SpotlightPopupStore {
  lastShownAt: number | null;
  showCount: number;
  lastProductId: number | null;
  markShown: (productId: number) => void;
  markConverted: () => void;
}

export const useSpotlightPopupStore = create<SpotlightPopupStore>()(
  persist(
    (set, get) => ({
      lastShownAt: null,
      showCount: 0,
      lastProductId: null,
      markShown: (productId) =>
        set({
          lastShownAt: Date.now(),
          showCount: get().showCount + 1,
          lastProductId: productId,
        }),
      markConverted: () => set({ showCount: 0 }),
    }),
    {
      name: "spotlight-popup-storage",
    },
  ),
);

export function isSpotlightOnCooldown(state: {
  lastShownAt: number | null;
  showCount: number;
}): boolean {
  if (state.lastShownAt === null) return false;

  const cooldown =
    state.showCount >= MAX_SPOTLIGHT_STAGE
      ? SPOTLIGHT_LONG_COOLDOWN_MS
      : SPOTLIGHT_COOLDOWN_MS;

  return Date.now() - state.lastShownAt < cooldown;
}
