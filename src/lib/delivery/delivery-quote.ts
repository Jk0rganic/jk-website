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
    code: "metro-doorstep",
    label: "Metro doorstep delivery",
    fee: 400,
    eta: "1 to 2 business days",
    fulfillmentType: "doorstep",
    counties: METRO_COUNTIES,
    freeAbove: 5000,
  },
  {
    code: "major-town-courier-office",
    label: "Major town courier office",
    fee: 450,
    eta: "2 to 3 business days",
    fulfillmentType: "courier-office",
    counties: MAJOR_TOWN_COUNTIES,
    freeAbove: 5000,
  },
  {
    code: "remote-stage",
    label: "Remote stage delivery",
    fee: 750,
    eta: "4 to 6 business days",
    fulfillmentType: "stage",
    counties: REMOTE_COUNTIES,
  },
  {
    code: "standard-upcountry-stage",
    label: "Standard upcountry stage delivery",
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

  return applyFreeDelivery(rate, input.cartSubtotal);
}

function applyFreeDelivery(
  rate: DeliveryDefaultRate | DeliveryAdminRate,
  cartSubtotal: number,
): DeliveryQuote {
  const freeDeliveryApplied =
    typeof rate.freeAbove === "number" && cartSubtotal >= rate.freeAbove;
  const freeDeliveryRemaining =
    typeof rate.freeAbove === "number"
      ? Math.max(0, rate.freeAbove - cartSubtotal)
      : 0;

  return {
    code: rate.code,
    label: rate.label,
    fee: freeDeliveryApplied ? 0 : rate.fee,
    ...(freeDeliveryApplied && rate.fee > 0 ? { originalFee: rate.fee } : {}),
    eta: rate.eta,
    fulfillmentType: rate.fulfillmentType,
    freeDeliveryApplied,
    freeDeliveryRemaining,
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
