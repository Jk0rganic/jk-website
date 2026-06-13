"use server";

import { fetchWoo } from "../fetch/fetchRest";

interface CustomerParams {
  email: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
}

export async function createWooCustomer({
  email,
  first_name,
  last_name,
  username,
}: CustomerParams) {
  const existing = await fetchWoo<WooCustomer[]>(
    `customers?email=${encodeURIComponent(email)}`,
    { noCache: true },
  );

  if (existing.length > 0) return existing[0];

  return fetchWoo<WooCustomer>("customers", {
    method: "POST",
    body: {
      email,
      first_name,
      last_name,
      username,
      password: Math.random().toString(36).slice(-8),
      role: "customer",
    },
  });
}