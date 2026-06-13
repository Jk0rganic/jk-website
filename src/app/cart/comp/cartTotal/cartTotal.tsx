"use client";

import React, { useCallback, useMemo } from "react";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import { useRouter } from "next/navigation";

interface CartTotalProps {
  cartCount: number;
  totalPrice: number;
}

export default function CartTotal({ cartCount, totalPrice }: CartTotalProps) {
  const router = useRouter();

  const freeShippingThreshold = 10000;

  const remainingAmount = useMemo(() => {
    return freeShippingThreshold - totalPrice;
  }, [totalPrice]);

  const finalTotal = useMemo(() => {
    return totalPrice >= freeShippingThreshold ? totalPrice : totalPrice;
  }, [totalPrice]);

  const handleCheckout = useCallback(() => {
    router.push(`/checkout`);
  }, [router]);

  return (
    <div className={k.total_wrapper}>
      {cartCount > 0 && (
        <div className={k.total_price}>
          <h5>Cart totals</h5>
          <table>
            <tbody>
              <tr className={k.subtotal_row}>
                <td>
                  <span className={k.heading}>Subtotal</span>
                </td>
                <td>
                  <span className={k.price}>{formatPrice(totalPrice)}</span>
                </td>
              </tr>

              <tr className={k.total_row}>
                <td>Total</td>
                <td>
                  <span className={k.price}>{formatPrice(finalTotal)}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className={k.check_out_wrap}>
            {totalPrice >= freeShippingThreshold ? (
              <p>You’re on Free Delivery!</p>
            ) : (
              <p>
                Add {formatPrice(remainingAmount)} more to qualify for free
                delivery.
              </p>
            )}
            <a href="/">Continue shopping</a>
            <button type="button" onClick={handleCheckout}>
              Proceed To Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
