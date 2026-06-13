// lib/baseUrl.ts

export function getWordpressConfig() {
  if (!process.env.NEXT_PUBLIC_WORDPRESS_URL) {
    throw new Error(
      "NEXT_PUBLIC_WORDPRESS_URL is not defined in environment variables",
    );
  }

  const BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

  // WooCommerce keys are optional — only needed for REST API
  const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || null;
  const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || null;

  return {
    BASE_URL,
    CONSUMER_KEY,
    CONSUMER_SECRET,
  };
}
