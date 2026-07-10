"use client";

import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import Section from "@/comp/section/section";
import { useCartStore } from "@/store/cartStore";
import CartProductTable from "../cartProductTable/cartProductTable";
import CartTotal from "../cartTotal/cartTotal";
import k from "./styles.module.scss";

export default function CartComp() {
  const { cartDetails, cartCount, totalPrice, removeItem, setItemQuantity } =
    useCartStore();

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity >= 1) setItemQuantity(id, quantity);
  };

  return (
    <Section className={k.shopping_cart}>
      <h4>Shopping Cart</h4>

      {cartCount === 0 ? (
        <div className={k.empty_cart}>
          <div className={k.shopping_icon_wrapper}>
            <ShoppingCartIcon />
            <p>Your cart is currently empty.</p>
          </div>
          <Link href="/products/all">Return To Shop</Link>
        </div>
      ) : (
        <>
          <CartProductTable
            cartDetails={cartDetails}
            removeItem={removeItem}
            updateQuantity={handleQuantityChange}
          />

          <CartTotal cartCount={cartCount} totalPrice={totalPrice} />
        </>
      )}
    </Section>
  );
}
