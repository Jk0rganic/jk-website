import CartComp from "./comp/cart-comp/cart-comp";
import { seoMeta } from "@/utils/seo/seoMeta";

export const metadata = seoMeta.cart;
export default function Cart() {
  return <CartComp />;
}
