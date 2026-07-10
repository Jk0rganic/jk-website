import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import DeliveryMethodSelector from "./deliveryMethodSelector ";

afterEach(() => {
  cleanup();
});

function DeliveryHarness() {
  const { register } = useForm<CheckOutSchemaType>({
    defaultValues: {
      delivery_method: "shipping",
    },
  });

  return <DeliveryMethodSelector register={register} />;
}

describe("DeliveryMethodSelector", () => {
  it("renders delivery choice cards while preserving radio values", () => {
    render(<DeliveryHarness />);

    const shipping = screen.getByRole("radio", { name: /home delivery/i });
    const pickup = screen.getByRole("radio", {
      name: /pickup point/i,
    });

    expect(shipping).toHaveAttribute("value", "shipping");
    expect(pickup).toHaveAttribute("value", "pickup");
    expect(screen.getByText(/door delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/stage or bus station/i)).toBeInTheDocument();
  });
});
