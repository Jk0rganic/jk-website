import k from "./styles.module.scss";
import { decodeHTML } from "@/utils/decode-html";

interface Props {
  selectedPrice?: string;
  regularPrice?: string;
  price?: string;
  productType: "SimpleProduct" | "VariableProduct";
}

const parsePrice = (p?: string) => Number(p?.replace(/[^0-9.-]+/g, ""));

const PriceHTML = ({
  price,
  className,
}: {
  price: string;
  className: string;
}) => (
  <h5
    className={className}
    dangerouslySetInnerHTML={{ __html: decodeHTML(price) }}
  />
);

export default function SingleSelectedPrice({
  selectedPrice,
  regularPrice,
  price,
  productType,
}: Props) {
  const finalPrice = productType === "SimpleProduct" ? price : selectedPrice;

  if (!finalPrice) return null;

  const selected = parsePrice(finalPrice);
  const regular = parsePrice(regularPrice);
  const hasDiscount = regular > selected;
  const discount = hasDiscount
    ? Math.round(((regular - selected) / regular) * 100)
    : null;

  return (
    <div className={k.price_box}>
      {hasDiscount ? (
        <>
          <PriceHTML price={regularPrice!} className={k.old_price} />
          <PriceHTML price={finalPrice} className={k.new_price} />
          {discount && <span className={k.discount}>−{discount}%</span>}
        </>
      ) : (
        <PriceHTML price={finalPrice} className={k.new_price} />
      )}
    </div>
  );
}
