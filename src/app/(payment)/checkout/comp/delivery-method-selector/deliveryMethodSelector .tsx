import type { UseFormRegister } from "react-hook-form";
import k from "./styles.module.scss";
import { Truck, CalendarCheck } from "lucide-react";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";

interface Props {
  register: UseFormRegister<CheckOutSchemaType>;
}

export default function DeliveryMethodSelector({ register }: Props) {
  const size = 20;

  return (
    <div className={k.delivery}>
      <h5>Delivery</h5>

      <div className={k.checkbox_wrapper}>
        <label>
          <input
            type="radio"
            value="shipping"
            {...register("delivery_method")}
            defaultChecked
          />
          Ship to my address (Kenya)
        </label>
        <Truck size={size} />
      </div>

      <div className={k.checkbox_wrapper}>
        <label>
          <input type="radio" value="pickup" {...register("delivery_method")} />
          Pick up from store
        </label>
        <CalendarCheck size={size} />
      </div>
    </div>
  );
}