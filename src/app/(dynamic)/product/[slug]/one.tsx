"use client";

import { useCallback, useMemo, useState } from "react";
import Article from "@/comp/article/Article";

import Section from "@/comp/section/section";

import { decodeHTML } from "@/utils/decode-html";
import AddToCart from "../comp/addToCart/addToCart";
import ProductImages from "../comp/product-images/product-images";
import ProductTags from "../comp/product-tags/product-tags";
import RatingReviews from "../comp/rating-reviews/rating-reviews";
import SingleProSocial from "../comp/single-pro-social/single-pro-social";
import SingleProductSizeVariations from "../comp/single-product-size-variations/single-product-size-variations";
import SingleSelectedPrice from "../comp/single-selected-price/single-selected-price";
import k from "./styles.module.scss";

type Props = {
  product: Product;
};

export default function One({ product }: Props) {
  const {
    name,
    price,
    regularPrice,
    shortDescription,
    stockStatus,
    reviewCount,
    reviews,
    sku,
    image,
    galleryImages,
    variations: variationsNode,
    productCategories,
    productTags,
    databaseId,
  } = product;

  const variations = useMemo(
    () => variationsNode?.nodes ?? [],
    [variationsNode],
  );

  const isVariable = variations.length > 0;

  const defaultVariation = useMemo<ProductVariation | null>(() => {
    return variations[0] ?? null;
  }, [variations]);

  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(defaultVariation);

  const active = selectedVariation ?? product;

  const priceDisplay = decodeHTML(active.price ?? "");
  const regularPriceDisplay = decodeHTML(
    active.regularPrice ?? regularPrice ?? "",
  );

  const category = productCategories?.nodes?.[0]?.name ?? "Products";

  const tags = productTags?.nodes ?? [];

  const selectedSize = selectedVariation?.attributes?.nodes?.[0]?.value ?? "";

  const handleSelect = useCallback(
    (v: ProductVariation) => setSelectedVariation(v),
    [],
  );

  const canAddToCart =
    stockStatus !== "OUT_OF_STOCK" &&
    (!isVariable || Boolean(selectedVariation));

  const averageRatings = reviews?.averageRating;

  return (
    <Section className={k.one}>
      <h1>
        Shop / {category} / <span>{name}</span>
      </h1>

      <div className={k.wrapper}>
        <ProductImages image={image} galleryImages={galleryImages?.nodes} />

        <Article className={k.content}>
          <h2>{name}</h2>

          <RatingReviews
            reviewCount={reviewCount}
            averageRating={averageRatings}
          />

          <SingleSelectedPrice
            selectedPrice={priceDisplay}
            regularPrice={regularPriceDisplay}
            price={price}
            productType={isVariable ? "VariableProduct" : "SimpleProduct"}
          />

          <div
            dangerouslySetInnerHTML={{
              __html: shortDescription ?? "",
            }}
          />

          {isVariable && (
            <SingleProductSizeVariations
              variation={{ nodes: variations }}
              selected={selectedVariation?.databaseId ?? 0}
              handleSelect={handleSelect}
            />
          )}

          {stockStatus === "OUT_OF_STOCK" && (
            <div className={k.stock_status}>Out of Stock</div>
          )}

          {canAddToCart && (
            <AddToCart
              product={product}
              selectedSize={selectedSize}
              sizePrice={priceDisplay}
              variationId={selectedVariation?.databaseId ?? databaseId}
            />
          )}

          <SingleProSocial />

          <div className={k.cat_sku}>
            <span>SKU: {sku ?? "N/A"}</span>
            <span>Category: {category}</span>
          </div>

          <ProductTags productTags={tags} />
        </Article>
      </div>
    </Section>
  );
}
