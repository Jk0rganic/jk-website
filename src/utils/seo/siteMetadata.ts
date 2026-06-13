import type { Metadata } from "next";

const SITE_URL = "https://www.jkorganics.co.ke";
const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dj200tags/images/v1768485350/JK-new-tag-line-Logo-1-2/JK-new-tag-line-Logo-1-2.webp";

interface SiteMetadataProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  keywords?: string;
  author?: string;
  robots?: string;
}

export function siteMetadata({
  title = "JK Organics | Organic Skincare & Weight Loss Products in Kenya",
  description = "JK Organics offers vegan, cruelty-free, and 100% organic skincare and weight loss products.",
  url = "",
  image = DEFAULT_IMAGE,
  keywords,
  robots = "index, follow",
}: SiteMetadataProps = {}): Metadata {
  const canonical = new URL(url, SITE_URL).toString();

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: { canonical },

    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "JK Organics",
      images: [{ url: image }],
      locale: "en_KE",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
