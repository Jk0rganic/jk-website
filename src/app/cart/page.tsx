import { seoMeta } from "@/utils/seo/seoMeta";
import CartComp from "./comp/cart-comp/cart-comp";

export const metadata = seoMeta.cart;
export default function Cart() {
  return <CartComp />;
}
