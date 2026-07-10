import { CircleX } from "lucide-react";
import ImgBox from "@/comp/imgbox/ImgBox";
import { formatPrice } from "@/utils/format-price";
import QuantityControl from "../quantityControl/quantityControl";
import CartProductTableMobile from "./cart-product-table-mobile/cart-product-table-mobile";
import k from "./styles.module.scss";

interface Props {
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}
export default function CartProductTable({
  cartDetails,
  removeItem,
  updateQuantity,
}: Props) {
  return (
    <div className={k.card_table}>
      {/* 💻 Desktop table */}
      <table className={`${k.product_table} ${k.web}`}>
        <thead>
          <tr>
            <th className={k.fit_content}>Image</th>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th className={k.fit_content}>Remove</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(cartDetails ?? {}).map((entry) => (
            <tr key={entry.id}>
              <td className={`${k.product_details} ${k.fit_content}`}>
                <ImgBox
                  className={k.img_box}
                  imageSrc={entry.image?.mediaItemUrl}
                  alt={entry.image?.title || entry.name}
                  srcSet={entry.image?.srcSet}
                  sizes={entry.image?.sizes}
                />
              </td>
              <td>
                <h6 className={k.item_tittle}>{entry.name}</h6>
              </td>
              <td>
                <h6>{formatPrice(entry.price)}</h6>
              </td>
              <td>
                <QuantityControl
                  updateQuantity={updateQuantity}
                  entry={entry}
                />
              </td>
              <td>
                <h6>{formatPrice(entry.price * entry.quantity)}</h6>
              </td>
              <td className={k.fit_content}>
                <button
                  type="button"
                  onClick={() => removeItem(entry.id)}
                  className={k.remove_button}
                  aria-label={`Remove ${entry.name}`}
                >
                  <CircleX color="red" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 📱 Mobile table */}
      <CartProductTableMobile
        cartDetails={cartDetails}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
      />
    </div>
  );
}
