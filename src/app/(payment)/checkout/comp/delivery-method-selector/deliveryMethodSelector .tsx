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
            <span className={k.title}>Delivery</span>
            <span className={k.description}>
              Nairobi door delivery, or upcountry town/stage pickup. We choose
              the delivery partner.
            </span>
          </span>
        </label>

        <label className={k.choice_card}>
          <input type="radio" value="pickup" {...register("delivery_method")} />
          <span className={k.icon}>
            <MapPin size={size} />
          </span>
          <span className={k.copy}>
            <span className={k.title}>Pick up from JK Organics</span>
            <span className={k.description}>
              Collect from our Nairobi CBD shop. Free and ready within 24 hours.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
