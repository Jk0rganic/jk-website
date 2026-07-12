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

    const shipping = screen.getByRole("radio", { name: /deliver/i });
    const pickup = screen.getByRole("radio", {
      name: /collect from shop/i,
    });

    expect(shipping).toHaveAttribute("value", "shipping");
    expect(pickup).toHaveAttribute("value", "pickup");
    expect(screen.getByText(/nairobi & upcountry/i)).toBeInTheDocument();
    expect(screen.getByText(/ready in 24h/i)).toBeInTheDocument();
  });
});
