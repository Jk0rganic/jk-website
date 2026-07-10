"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getSpotlightPool,
  type SpotlightProduct,
} from "@/lib/storefront/spotlight-products";
import {
  isSpotlightOnCooldown,
  useSpotlightPopupStore,
} from "@/store/spotlightPopupStore";
import { decodeHTML } from "@/utils/decode-html";
import { formatPrice } from "@/utils/format-price";

import k from "./styles.module.scss";

// Delay before the popup can appear — long enough to not read as an
// intrusive interstitial, short enough to still catch browsing visitors.
const SHOW_DELAY_MS = 6000;
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

export default function SpotlightPopup() {
  const pathname = usePathname();
  const [product, setProduct] = useState<SpotlightProduct | null>(null);
  const [visible, setVisible] = useState(false);

  const isExcludedRoute = EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  useEffect(() => {
    if (isExcludedRoute) return;
    if (isSpotlightOnCooldown(useSpotlightPopupStore.getState().lastShownAt)) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      getSpotlightPool()
        .then((pool) => {
          if (cancelled || pool.length === 0) return;

          const pick = pool[Math.floor(Math.random() * pool.length)];
          setProduct(pick);
          setVisible(true);
          useSpotlightPopupStore.getState().markShown();
          pushDataLayerEvent({
            event: "spotlight_popup_view",
            spotlight_product_id: pick.id,
            spotlight_badge: pick.badge,
          });
        })
        .catch((err) => {
          console.error("Failed to load spotlight product", err);
        });
    }, SHOW_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isExcludedRoute]);

  if (isExcludedRoute) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (product) {
      pushDataLayerEvent({
        event: "spotlight_popup_dismiss",
        spotlight_product_id: product.id,
      });
    }
  };

  const handleClick = () => {
    if (product) {
      pushDataLayerEvent({
        event: "spotlight_popup_click",
        spotlight_product_id: product.id,
        spotlight_badge: product.badge,
      });
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && product && (
        <motion.div
          className={k.spotlight}
          role="dialog"
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
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
