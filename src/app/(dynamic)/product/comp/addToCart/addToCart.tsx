"use client";
import { useMemo } from "react";
import k from "./styles.module.scss";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";

const getNumericPrice = (price?: string) =>
  parseFloat(price?.replace(/[^\d.]/g, "") ?? "") || 0;

interface CartButtonsProps {
  cartCount: number;
  onAdd: () => void;
  onRemove: () => void;
}

interface ActionProps {
  onAdd: () => void;
}

interface Product {
  databaseId: number;
  id: string;
  name: string;
  image?: unknown;
}

interface Props {
  product: Product;
  selectedSize?: string;
  sizePrice?: string;
  variationId?: number | null;
}

const CartButtons = ({ cartCount, onAdd, onRemove }: CartButtonsProps) => (
  <div className={k.product_count_box}>
    <button
      type="button"
      onClick={onRemove}
      className={k.quantity_button}
      disabled={cartCount === 0}
    >
      -
    </button>
    <span className={k.product_count}>{cartCount}</span>
    <button type="button" onClick={onAdd} className={k.quantity_button}>
      +
    </button>
  </div>
);

const AddToCartButton = ({ onAdd }: ActionProps) => (
  <div className={k.btn_wrapper}>
    <button type="button" className={k.add_to_cart_button} onClick={onAdd}>
      Add to cart
    </button>
  </div>
);

const BuyItNow = ({ onAdd }: ActionProps) => (
  <div className={k.btn_wrapper}>
    <Link href="/checkout" className={k.buy_it_now} onClick={onAdd}>
      Buy it now
    </Link>
  </div>
);

export default function AddToCart({
  product,
  selectedSize = "",
  sizePrice,
  variationId = null,
}: Props) {
  const addToCart = useCartStore((s) => s.addToCart);
  const setItemQuantity = useCartStore((s) => s.setItemQuantity);
  const cartDetails = useCartStore((s) => s.cartDetails);

  const { databaseId, id, name, image } = product;
  const uniqueId = selectedSize ? `${id}-${selectedSize}` : id;

  const cartProduct = useMemo(
    () => ({
      id: uniqueId,
      databaseId,
      name: selectedSize ? `${name} (${selectedSize})` : name,
      price: getNumericPrice(sizePrice),
      variation_id: variationId ?? databaseId,
      quantity: 1,
      selectedSize: selectedSize || null,
      image,
    }),
    [uniqueId, name, sizePrice, selectedSize, image, variationId, databaseId],
  );

  const cartCount =
    cartDetails.find((item: any) => item.id === uniqueId)?.quantity ?? 0;

  const handleAdd = () => addToCart(cartProduct);
  const handleIncrease = () => setItemQuantity(uniqueId, cartCount + 1);
  const handleDecrease = () =>
    setItemQuantity(uniqueId, Math.max(cartCount - 1, 0));

  return (
    <div className={k.cart_box}>
      {cartCount > 0 ? (
        <>
          <CartButtons
            cartCount={cartCount}
            onAdd={handleIncrease}
            onRemove={handleDecrease}
          />
          <div className={k.btn_wrapper}>
            <Link href="/cart" className={k.proceed_to_cart}>
              Proceed to cart
            </Link>
          </div>
        </>
      ) : (
        <>
          <AddToCartButton onAdd={handleAdd} />
          <BuyItNow onAdd={handleAdd} />
        </>
      )}
    </div>
  );
}
