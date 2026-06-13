import React from "react";
import k from "./styles.module.scss";

interface Props {
  updateQuantity: (id: string, quantity: number) => void;
  entry: {
    id: string;
    quantity: number;
  };
}
const QuantityControl = ({ updateQuantity, entry }: Props) => {
  return (
    <div className={k.quantity_control}>
      <button
        type="button"
        onClick={() => updateQuantity(entry.id, entry.quantity - 1)}
        disabled={entry.quantity <= 1}
        className={k.quantity_button}
      >
        -
      </button>
      <span>{entry.quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(entry.id, entry.quantity + 1)}
        className={k.quantity_button}
      >
        +
      </button>
    </div>
  );
};

export default QuantityControl;
