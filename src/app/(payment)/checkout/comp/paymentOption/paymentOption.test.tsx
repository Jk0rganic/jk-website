import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import PaymentOption from "./paymentOption";

afterEach(() => {
  cleanup();
});

function PaymentHarness({
  isLoggedIn = false,
  paymentMethod = "pay_online",
}: {
  isLoggedIn?: boolean;
  paymentMethod?: CheckOutSchemaType["paymentMethod"];
}) {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useForm<CheckOutSchemaType>({
    defaultValues: {
      billing_phone: "0712345678",
      paymentMethod,
    },
  });

  return (
    <PaymentOption
      register={register}
      control={control}
      errors={errors}
      watch={watch}
      orderTotal={1250}
      isLoggedIn={isLoggedIn}
    />
  );
}

describe("PaymentOption", () => {
  it("renders M-Pesa as the only payment option and explains payment is required", () => {
    render(<PaymentHarness />);

    const mpesa = screen.getByRole("radio", { name: /^m-pesa/i });

    expect(mpesa).toHaveAttribute("value", "pay_online");
    expect(
      screen.queryByRole("radio", { name: /cash on delivery/i }),
    ).toBeNull();
    expect(screen.queryByText(/pay when your order arrives/i)).toBeNull();
    expect(screen.getAllByText(/stk push/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/payment is required/i)).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText(/1,250/)).toBeInTheDocument();
    expect(screen.getByText(/sign in is required/i)).toBeInTheDocument();
  });
});
