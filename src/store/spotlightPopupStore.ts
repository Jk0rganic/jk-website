import { create } from "zustand";
import { persist } from "zustand/middleware";

// Once shown, don't show again for this long — long enough to not annoy a
// same-day repeat visitor, short enough that the spotlight rotates in new
// picks on their next real visit.
export const SPOTLIGHT_COOLDOWN_MS = 20 * 60 * 60 * 1000;

interface SpotlightPopupStore {
  lastShownAt: number | null;
  markShown: () => void;
}

export const useSpotlightPopupStore = create<SpotlightPopupStore>()(
  persist(
    (set) => ({
      lastShownAt: null,
      markShown: () => set({ lastShownAt: Date.now() }),
    }),
    {
      name: "spotlight-popup-storage",
    },
  ),
);

export function isSpotlightOnCooldown(lastShownAt: number | null): boolean {
  return (
    lastShownAt !== null && Date.now() - lastShownAt < SPOTLIGHT_COOLDOWN_MS
  );
}
