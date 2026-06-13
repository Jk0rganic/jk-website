import k from "./styles.module.scss";

interface Props {
  regularPrice: string;
  selectedPrice: string;
}

const calculateDiscount = (regular: string, sale: string) => {
  const regularNum = parseFloat(regular.replace(/[^0-9.]/g, ""));
  const saleNum = parseFloat(sale.replace(/[^0-9.]/g, ""));

  if (!regularNum || !saleNum || saleNum >= regularNum) return 0;
  return Math.round(((regularNum - saleNum) / regularNum) * 100);
};

export default function ProductOfferDiscount({
  regularPrice,
  selectedPrice,
}: Props) {
  const discount = calculateDiscount(regularPrice, selectedPrice);

  if (discount <= 0) return null;

  return (
    <div className={k.price_box}>
      <span className={k.offer}>-{discount}%</span>
    </div>
  );
}
