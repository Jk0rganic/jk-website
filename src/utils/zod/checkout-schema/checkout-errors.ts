const DEFAULT_CHECKOUT_ERROR = "Please check the highlighted checkout fields.";

function findMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  if (
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }

  for (const nested of Object.values(value)) {
    const message = findMessage(nested);
    if (message) return message;
  }

  return null;
}

export function getFirstCheckoutErrorMessage(errors: unknown): string {
  return findMessage(errors) ?? DEFAULT_CHECKOUT_ERROR;
}
