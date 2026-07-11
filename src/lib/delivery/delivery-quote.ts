export type DeliveryMethod = "pickup" | "shipping";

export type DeliveryFulfillmentType =
  | "pickup"
  | "doorstep"
  | "courier-office"
  | "stage";

export type DeliveryQuoteInput = {
  deliveryMethod: DeliveryMethod;
  county?: string;
  cartSubtotal: number;
};

export type DeliveryAdminRate = {
  code: string;
  label: string;
  fee: number;
  eta: string;
  fulfillmentType: Exclude<DeliveryFulfillmentType, "pickup">;
  active: boolean;
  counties?: string[];
  freeAbove?: number;
};

export type DeliveryQuote = {
  code: string;
  label: string;
  fee: number;
  originalFee?: number;
  eta: string;
  fulfillmentType: DeliveryFulfillmentType;
  freeDeliveryApplied: boolean;
  freeDeliveryRemaining: number;
};

type DeliveryDefaultRate = Omit<DeliveryAdminRate, "active"> & {
  counties?: string[];
};

const METRO_COUNTIES = ["Kiambu", "Kajiado", "Machakos"];
const MAJOR_TOWN_COUNTIES = ["Mombasa", "Kisumu", "Nakuru", "Uasin Gishu"];
const REMOTE_COUNTIES = ["Mandera", "Marsabit", "Turkana", "Wajir"];

export const DEFAULT_DELIVERY_RATES: DeliveryDefaultRate[] = [
  {
    code: "nairobi-doorstep",
    label: "Nairobi doorstep delivery",
    fee: 300,
    eta: "Same day to 24 hours",
    fulfillmentType: "doorstep",
    counties: ["Nairobi"],
    freeAbove: 4000,
  },
  {
    code: "metro-stage-pickup",
    label: "Metro town/stage pickup",
    fee: 400,
    eta: "1 to 2 business days",
    fulfillmentType: "stage",
    counties: METRO_COUNTIES,
    freeAbove: 5000,
  },
  {
    code: "major-town-courier-office",
    label: "Major town/stage pickup",
    fee: 450,
    eta: "2 to 3 business days",
    fulfillmentType: "stage",
    counties: MAJOR_TOWN_COUNTIES,
    freeAbove: 5000,
  },
  {
    code: "remote-stage",
    label: "Remote town/stage pickup",
    fee: 750,
    eta: "4 to 6 business days",
    fulfillmentType: "stage",
    counties: REMOTE_COUNTIES,
  },
  {
    code: "standard-upcountry-stage",
    label: "Standard upcountry town/stage pickup",
    fee: 550,
    eta: "3 to 5 business days",
    fulfillmentType: "stage",
  },
];

const PICKUP_QUOTE: DeliveryQuote = {
  code: "pickup",
  label: "Pickup from JK Organics",
  fee: 0,
  eta: "Ready within 24 hours",
  fulfillmentType: "pickup",
  freeDeliveryApplied: false,
  freeDeliveryRemaining: 0,
};

export function resolveDeliveryQuote(
  input: DeliveryQuoteInput,
  adminRates: DeliveryAdminRate[] = [],
): DeliveryQuote {
  if (input.deliveryMethod === "pickup") {
    return PICKUP_QUOTE;
  }

  const rate =
    adminRates.find((adminRate) =>
      rateMatchesCounty(adminRate, input.county),
    ) ??
    DEFAULT_DELIVERY_RATES.find((defaultRate) =>
      rateMatchesCounty(defaultRate, input.county),
    ) ??
    DEFAULT_DELIVERY_RATES.find(
      (defaultRate) => defaultRate.code === "standard-upcountry-stage",
    );

  if (!rate) {
    throw new Error("Missing standard delivery rate");
  }

  return applyFreeDelivery(rate, input.cartSubtotal, input.county);
}

function applyFreeDelivery(
  rate: DeliveryDefaultRate | DeliveryAdminRate,
  cartSubtotal: number,
  county?: string,
): DeliveryQuote {
  const normalizedRate = normalizeCustomerFacingRate(rate, county);
  const freeDeliveryApplied =
    typeof normalizedRate.freeAbove === "number" &&
    cartSubtotal >= normalizedRate.freeAbove;
  const freeDeliveryRemaining =
    typeof normalizedRate.freeAbove === "number"
      ? Math.max(0, normalizedRate.freeAbove - cartSubtotal)
      : 0;

  return {
    code: normalizedRate.code,
    label: normalizedRate.label,
    fee: freeDeliveryApplied ? 0 : normalizedRate.fee,
    ...(freeDeliveryApplied && normalizedRate.fee > 0
      ? { originalFee: normalizedRate.fee }
      : {}),
    eta: normalizedRate.eta,
    fulfillmentType: normalizedRate.fulfillmentType,
    freeDeliveryApplied,
    freeDeliveryRemaining,
  };
}

function normalizeCustomerFacingRate(
  rate: DeliveryDefaultRate | DeliveryAdminRate,
  county?: string,
): DeliveryDefaultRate | DeliveryAdminRate {
  if (!county || normalizeCounty(county) === "nairobi") {
    return rate;
  }

  if (rate.fulfillmentType !== "doorstep" && !/doorstep/i.test(rate.label)) {
    return rate;
  }

  return {
    ...rate,
    label: rate.label.replace(/doorstep delivery/gi, "town/stage pickup"),
    fulfillmentType: "stage",
  };
}

function rateMatchesCounty(
  rate: DeliveryDefaultRate | DeliveryAdminRate,
  county?: string,
): boolean {
  if ("active" in rate && !rate.active) {
    return false;
  }

  if (!rate.counties || rate.counties.length === 0) {
    return true;
  }

  if (!county) {
    return false;
  }

  const normalizedCounty = normalizeCounty(county);
  return rate.counties.some(
    (rateCounty) => normalizeCounty(rateCounty) === normalizedCounty,
  );
}

function normalizeCounty(county: string): string {
  return county.trim().toLowerCase();
}
