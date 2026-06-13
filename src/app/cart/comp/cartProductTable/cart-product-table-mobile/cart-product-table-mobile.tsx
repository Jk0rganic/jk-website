import { CircleX } from "lucide-react";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import ImgBox from "@/comp/imgbox/ImgBox";
import QuantityControl from "../../quantityControl/quantityControl";

interface Props {
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}
export default function CartProductTableMobile({
  cartDetails,
  removeItem,
  updateQuantity,
}: Props) {
  return (
    <div className={k.card_table}>
      {/* 📱 Mobile table */}
      <table className={`${k.product_table} ${k.mobile}`}>
        <tbody>
          {Object.values(cartDetails ?? {}).map((entry) => (
            <tr key={entry.id}>
              <td className={k.product_details}>
                <button
                  type="button"
                  onClick={() => removeItem(entry.id)}
                  className={k.remove_button}
                  aria-label={`Remove ${entry.name}`}
                >
                  <CircleX color="red" />
                </button>
                <ImgBox
                  className={k.imgbox}
                  imageSrc={entry.image?.mediaItemUrl}
                  alt={entry.image?.title || entry.name}
                  srcSet={entry.image?.srcSet}
                  sizes={entry.image?.sizes}
                />
              </td>
              <td>
                <h6>
                  {entry.name} × {entry.quantity} –{" "}
                  {formatPrice(entry.price * entry.quantity)}
                </h6>
                <QuantityControl
                  updateQuantity={updateQuantity}
                  entry={entry}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
