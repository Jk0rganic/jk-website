import { Home, MapPin } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import k from "./styles.module.scss";

interface Props {
  register: UseFormRegister<CheckOutSchemaType>;
}

export default function DeliveryMethodSelector({ register }: Props) {
  const size = 20;

  return (
    <div className={k.delivery}>
      <div className={k.choice_grid}>
        <label className={k.choice_card}>
          <input
            type="radio"
            value="shipping"
            {...register("delivery_method")}
            defaultChecked
          />
          <span className={k.icon}>
            <Home size={size} />
          </span>
          <span className={k.copy}>
            <span className={k.title}>Home delivery</span>
            <span className={k.description}>
              Nairobi door delivery and county parcel delivery where available.
            </span>
          </span>
        </label>

        <label className={k.choice_card}>
          <input type="radio" value="pickup" {...register("delivery_method")} />
          <span className={k.icon}>
            <MapPin size={size} />
          </span>
          <span className={k.copy}>
            <span className={k.title}>Pickup point</span>
            <span className={k.description}>
              Any stage or bus station that is convenient for you.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
