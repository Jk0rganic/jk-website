"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import k from "./styles.module.scss";

import ImgBox from "../../../imgbox/ImgBox";
import Article from "../../../article/Article";
import ProductSizeVariations from "../product-size-variations/product-size-variations";
import ProductOfferDiscount from "../product-offer-discount/product-offer-discount";
import CatStarComp from "../cat-star-comp/cat-star-comp";

import { decodeHTML } from "@/utils/decode-html";

type Props = {
  product: Product;
  index: number;
  showNew?: boolean;
  newCount?: number;
};

export default function ProductCard({
  product,
  index,
  showNew = false,
  newCount = 4,
}: Props) {
  const variation = product.variations;
  const productType = product.__typename;

  const [selected, setSelected] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [regularPrice, setRegularPrice] = useState<string>("");

  useEffect(() => {
    const nodes = variation?.nodes ?? [];

    if (nodes.length > 0) {
      const defaultVar = nodes.length > 1 ? nodes[1] : nodes[0];

      setSelected(defaultVar.databaseId);
      setSelectedPrice(decodeHTML(defaultVar.price));
      setRegularPrice(decodeHTML(defaultVar.regularPrice));
      return;
    }

    if (productType === "SimpleProduct") {
      setSelectedPrice(decodeHTML(product.price ?? ""));
      setRegularPrice(decodeHTML(product.regularPrice ?? ""));
    }
  }, [variation, productType, product]);

  const handleSelect = (v: ProductVariation) => {
    setSelected(v.databaseId);
    setSelectedPrice(decodeHTML(v.price));
    setRegularPrice(decodeHTML(v.regularPrice));
  };

  const image = product.image;

  return (
    <div className={k.card}>
      <Link href={`/product/${product.slug}`}>
        <ImgBox
          className={k.img_box}
          imageSrc={image?.mediaItemUrl ?? ""}
          srcSet={image?.srcSet}
          sizes={image?.sizes}
          alt={image?.title}
        />

        <Article className={k.content}>
          <CatStarComp product={product} />
          <h3>{product.name}</h3>
        </Article>
      </Link>

      <ProductSizeVariations
        variation={variation}
        selected={selected}
        selectedPrice={selectedPrice}
        regularPrice={regularPrice}
        handleSelect={handleSelect}
        price={product.price}
      />

      <div className={k.absolute}>
        {showNew && index < newCount && (
          <span className={k.new_badge}>New</span>
        )}

        <ProductOfferDiscount
          regularPrice={regularPrice}
          selectedPrice={selectedPrice}
        />
      </div>
    </div>
  );
}
