import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import AdditionInformation from "./AdditionInformation";

function AdditionInformationHarness() {
  const {
    register,
    formState: { errors },
  } = useForm<CheckOutSchemaType>();

  return <AdditionInformation register={register} errors={errors} />;
}

describe("AdditionInformation", () => {
  it("keeps order notes collapsed until requested", async () => {
    render(<AdditionInformationHarness />);

    expect(screen.getByText("Add order note")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Add order note"));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
