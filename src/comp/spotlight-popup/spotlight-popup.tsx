"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  getSpotlightPool,
  type SpotlightProduct,
} from "@/lib/storefront/spotlight-products";
import {
  isSpotlightOnCooldown,
  MAX_SPOTLIGHT_STAGE,
  useSpotlightPopupStore,
} from "@/store/spotlightPopupStore";
import { decodeHTML } from "@/utils/decode-html";
import { formatPrice } from "@/utils/format-price";

import k from "./styles.module.scss";

// Sweet spot for a time-based trigger, layered with scroll depth and
// exit-intent so whichever signals real intent first opens the popup.
const SHOW_DELAY_MS = 8000;
const SCROLL_DEPTH_TRIGGER = 0.5;
const EXCLUDED_PATH_PREFIXES = ["/cart", "/checkout", "/payment"];

const badgeLabel: Record<SpotlightProduct["badge"], string> = {
  bestseller: "Bestseller",
  featured: "Featured pick",
};

function pushDataLayerEvent(payload: Record<string, unknown>) {
  const dataLayer = (
    window as unknown as { dataLayer?: Record<string, unknown>[] }
  ).dataLayer;
  dataLayer?.push(payload);
}

function pickProduct(
  pool: SpotlightProduct[],
  excludeId: number | null,
): SpotlightProduct {
  const candidates =
    pool.length > 1 ? pool.filter((p) => p.id !== excludeId) : pool;
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export default function SpotlightPopup() {
  const pathname = usePathname();
  const [product, setProduct] = useState<SpotlightProduct | null>(null);
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(1);

  const isExcludedRoute = EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  useEffect(() => {
    if (isExcludedRoute) return;

    const state = useSpotlightPopupStore.getState();
    if (isSpotlightOnCooldown(state)) return;

    const nextStage = Math.min(state.showCount + 1, MAX_SPOTLIGHT_STAGE);
    let settled = false;

    const reveal = () => {
      if (settled) return;
      settled = true;
      cleanup();

      getSpotlightPool()
        .then((pool) => {
          if (pool.length === 0) return;

          const pick = pickProduct(pool, state.lastProductId);
          setProduct(pick);
          setStage(nextStage);
          setVisible(true);
          useSpotlightPopupStore.getState().markShown(pick.id);
          pushDataLayerEvent({
            event: "spotlight_popup_view",
            spotlight_product_id: pick.id,
            spotlight_badge: pick.badge,
            spotlight_stage: nextStage,
          });
        })
        .catch((err) => {
          console.error("Failed to load spotlight product", err);
        });
    };

    // The final stage is a last-resort nudge shown only when the visitor is
    // actually leaving — no point competing for attention before that.
    const exitIntentOnly = nextStage >= MAX_SPOTLIGHT_STAGE;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let scrollTicking = false;

    const handleScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        const doc = document.documentElement;
        const depth = window.scrollY / (doc.scrollHeight - doc.clientHeight);
        if (depth >= SCROLL_DEPTH_TRIGGER) reveal();
      });
    };

    const handleExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) reveal();
    };

    const hasFinePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches;

    function cleanup() {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseout", handleExitIntent);
    }

    if (exitIntentOnly) {
      if (hasFinePointer) {
        document.addEventListener("mouseout", handleExitIntent);
      }
    } else {
      timer = setTimeout(reveal, SHOW_DELAY_MS);
      window.addEventListener("scroll", handleScroll, { passive: true });
      if (hasFinePointer) {
        document.addEventListener("mouseout", handleExitIntent);
      }
    }

    return cleanup;
  }, [isExcludedRoute]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (product) {
      pushDataLayerEvent({
        event: "spotlight_popup_dismiss",
        spotlight_product_id: product.id,
      });
    }
  }, [product]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, handleDismiss]);

  if (isExcludedRoute) return null;

  const handleClick = () => {
    if (product) {
      pushDataLayerEvent({
        event: "spotlight_popup_click",
        spotlight_product_id: product.id,
        spotlight_badge: product.badge,
        spotlight_stage: stage,
      });
      useSpotlightPopupStore.getState().markConverted();
    }
    setVisible(false);
  };

  const showSocialProof = stage >= 2 && product && product.ratingCount > 0;
  const showUrgency =
    stage >= 3 && product && product.lowStockRemaining !== null;

  return (
    <AnimatePresence>
      {visible && product && (
        <motion.div
          className={k.spotlight}
          role="region"
          aria-live="polite"
          aria-label="Recommended product"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button
            type="button"
            className={k.close}
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          <Link
            href={`/product/${product.slug}`}
            className={k.body}
            onClick={handleClick}
          >
            <div className={k.imageBox}>
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={decodeHTML(product.imageAlt)}
                  fill
                  sizes="72px"
                />
              )}
            </div>

            <div className={k.info}>
              <span className={k.badge}>{badgeLabel[product.badge]}</span>
              <h4>{decodeHTML(product.name)}</h4>

              <div className={k.price}>
                {product.salePrice && (
                  <span className={k.oldPrice}>
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
                <span className={k.newPrice}>
                  {formatPrice(product.salePrice || product.price)}
                </span>
              </div>

              {showSocialProof && (
                <p className={k.socialProof}>
                  ★ {product.rating.toFixed(1)} ({product.ratingCount} reviews)
                </p>
              )}

              {showUrgency && (
                <p className={k.urgency}>
                  Only {product.lowStockRemaining} left in stock
                </p>
              )}

              <span className={k.cta}>Shop now</span>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
