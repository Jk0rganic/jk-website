import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore"; // make sure this path is correct
import k from "./styles.module.scss";

export default function ShoppingCartComp() {
  const { cartCount } = useCartStore();

  return (
    <Link href="/cart" className={k.cart}>
      <span className={k.count}>{cartCount}</span>
      <ShoppingCart size={18} />
    </Link>
  );
}
