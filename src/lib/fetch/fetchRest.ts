"use server";

import { getWordpressConfig } from "./baseUrl";

export interface FetchWooOptions<TBody = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: TBody;
  noCache?: boolean;
  revalidate?: number;
}

interface WooCommerceError {
  code?: string;
  message?: string;
  data?: {
    status?: number;
  };
}

const createAuthHeader = (
  consumerKey: string,
  consumerSecret: string,
): string =>
  `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;

function getWooErrorMessage(
  error: WooCommerceError | string,
  status: number,
): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    error.code === "rest_cannot_create" ||
    error.message?.includes("not allowed to create posts")
  ) {
    return [
      "The WordPress/WooCommerce API user connected to WC_CONSUMER_KEY is not allowed to create products or media.",
      "Create or update WooCommerce REST keys for a WordPress Administrator or Shop Manager account, then update WC_CONSUMER_KEY and WC_CONSUMER_SECRET.",
    ].join(" ");
  }

  return error.message || `WooCommerce request failed (${status})`;
}

export async function fetchWoo<TResponse = unknown>(
  endpoint: string,
  options: FetchWooOptions = {},
): Promise<TResponse> {
  const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getWordpressConfig();

  if (!BASE_URL) {
    throw new Error("Missing BASE_URL");
  }

  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error("Missing WooCommerce credentials");
  }

  const {
    method = "GET",
    headers,
    body,
    noCache = false,
    revalidate = 600,
  } = options;

  const url = new URL(
    endpoint.replace(/^\/+/, ""),
    `${BASE_URL}/wp-json/wc/v3/`,
  );

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: createAuthHeader(CONSUMER_KEY, CONSUMER_SECRET),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,

    ...(method === "GET" && !noCache
      ? {
          cache: "force-cache",
          next: { revalidate },
        }
      : {
          cache: "no-store",
        }),
  });

  if (!response.ok) {
    let error: WooCommerceError | string;

    try {
      error = await response.json();
    } catch {
      error = await response.text();
    }

    throw new Error(getWooErrorMessage(error, response.status));
  }

  return response.json() as Promise<TResponse>;
}
