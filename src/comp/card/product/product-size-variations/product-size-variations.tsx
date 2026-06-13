"use client";

import k from "./styles.module.scss";
import { decodeHTML } from "@/utils/decode-html";

type Props = {
  variation?: {
    nodes: ProductVariation[];
  };

  selected: number | null;
  selectedPrice: string | undefined;
  regularPrice: string;
  handleSelect: (v: ProductVariation) => void;

  price?: string;
};

export default function ProductSizeVariations({
  variation,
  selected,
  selectedPrice,
  regularPrice,
  handleSelect,
  price,
}: Props) {
  const hasVariations = (variation?.nodes?.length ?? 0) > 0;

  const cleanPrice = (value?: string) =>
    decodeHTML(value || "")
      .replace(/[^\d.]/g, "")
      .trim();

  const isOnSale =
    cleanPrice(regularPrice) !== cleanPrice(selectedPrice || price);

  const renderPrice = () => {
    const safeDecode = (v: string | undefined) => decodeHTML(v ?? "");

    // VARIABLE PRODUCT

    if (hasVariations) {
      if (!selectedPrice) {
        return <h5 className={k.new_price}>Select a size</h5>;
      }

      if (isOnSale) {
        return (
          <>
            <h5
              className={k.old_price}
              dangerouslySetInnerHTML={{
                __html: safeDecode(regularPrice),
              }}
            />
            <h5
              className={k.new_price}
              dangerouslySetInnerHTML={{
                __html: safeDecode(selectedPrice),
              }}
            />
          </>
        );
      }

      return (
        <h5
          className={k.new_price}
          dangerouslySetInnerHTML={{
            __html: safeDecode(selectedPrice),
          }}
        />
      );
    }

    // SIMPLE PRODUCT
    if (isOnSale) {
      return (
        <>
          <h5
            className={k.old_price}
            dangerouslySetInnerHTML={{
              __html: safeDecode(regularPrice),
            }}
          />
          <h5
            className={k.new_price}
            dangerouslySetInnerHTML={{
              __html: safeDecode(price),
            }}
          />
        </>
      );
    }

    return (
      <h5
        className={k.new_price}
        dangerouslySetInnerHTML={{
          __html: safeDecode(price),
        }}
      />
    );
  };

  return (
    <div className={k.size}>
      {/* PRICE */}
      <div className={k.price_box}>{renderPrice()}</div>

      {/* VARIATIONS */}
      {hasVariations && (
        <div className={k.options}>
          {variation!.nodes.map((v) => {
            const sizeAttr = v.attributes?.nodes?.find(
              (attr) => attr.name?.toLowerCase() === "size",
            );

            const sizeLabel = sizeAttr?.value ?? "N/A";

            return (
              <button
                type="button"
                key={v.databaseId}
                onClick={() => handleSelect(v)}
                className={`${k.option} ${
                  selected === v.databaseId ? k.active : ""
                }`}
              >
                <span>{sizeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
