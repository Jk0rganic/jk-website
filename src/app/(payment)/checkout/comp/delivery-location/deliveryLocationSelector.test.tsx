import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import DeliveryLocationSelector from "./deliveryLocationSelector";

function DeliveryLocationHarness() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckOutSchemaType>({
    defaultValues: {
      delivery_method: "shipping",
      paymentMethod: "pay_online",
    },
  });

  return (
    <DeliveryLocationSelector
      control={control}
      errors={errors}
      setValue={setValue}
      shippingZones={[]}
      deliveryQuote={{
        fee: 400,
        label: "Metro town/stage pickup",
        eta: "1 to 2 business days",
      }}
    />
  );
}

describe("DeliveryLocationSelector", () => {
  it("reveals an enabled nearest town field after selecting an upcountry county", async () => {
    const user = userEvent.setup();
    render(<DeliveryLocationHarness />);

    const county = screen.getByLabelText(/county/i);
    await user.type(county, "Kiambu");
    await user.tab();

    const nearestTown = screen.getByLabelText(/nearest town/i);
    expect(nearestTown).not.toBeDisabled();
    expect(
      screen.queryByPlaceholderText(/select county first/i),
    ).not.toBeInTheDocument();
  });

  it("lets the customer type and select a valid nearest town for that county", async () => {
    const user = userEvent.setup();
    render(<DeliveryLocationHarness />);

    await user.type(screen.getByLabelText(/county/i), "Kiambu");
    await user.tab();

    const nearestTown = screen.getByLabelText(/nearest town/i);
    await user.type(nearestTown, "Kimende");
    await user.tab();

    expect(nearestTown).toHaveValue("Kimende");
  });

  it("lets the customer pick a county by clicking a dropdown suggestion", async () => {
    const user = userEvent.setup();
    render(<DeliveryLocationHarness />);

    const county = screen.getByLabelText(/county/i);
    await user.type(county, "Kiam");
    await user.click(await screen.findByRole("option", { name: "Kiambu" }));

    expect(county).toHaveValue("Kiambu");
    expect(
      screen.queryByText(/select a county from the suggestion list/i),
    ).not.toBeInTheDocument();
  });

  it("allows backspacing and retyping in the county field", async () => {
    const user = userEvent.setup();
    render(<DeliveryLocationHarness />);

    const county = screen.getByLabelText(/county/i);
    await user.type(county, "Kiambu");
    expect(county).toHaveValue("Kiambu");

    await user.type(county, "{Backspace}{Backspace}{Backspace}");
    expect(county).toHaveValue("Kia");

    await user.type(county, "mbu");
    expect(county).toHaveValue("Kiambu");
  });
});
