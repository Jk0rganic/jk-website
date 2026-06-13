const SITE_URL = "https://www.jkorganics.co.ke";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JK Organics",
    url: SITE_URL,
    logo: "https://res.cloudinary.com/dj200tags/images/v1768485350/JK-new-tag-line-Logo-1-2/JK-new-tag-line-Logo-1-2.webp",
    sameAs: [
      "https://facebook.com/share/1ANz5Y2vfv",
      "https://instagram.com/jkorganic_s",
      "https://www.tiktok.com/@jkorganics",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254795782207",
      contactType: "Customer Support",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };
}

interface ProductSchemaInput {
  name: string;
  image: string;
  description: string;
  sku: string;
  slug: string;
  price: number | string;
  inStock: boolean;
}

export function productSchema(product: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "JK Organics" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "KES",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

interface BlogSchemaInput {
  title: string;
  image: string;
  date: string;
  modified: string;
  slug: string;
  author: { node: { name: string } };
}

export function blogSchema(post: BlogSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.image,
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      "@type": "Person",
      name: post.author.node.name,
    },
    publisher: { "@type": "Organization", name: "JK Organics" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}