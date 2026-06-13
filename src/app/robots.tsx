export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cart",
        "/checkout",
        "/login",
        "/api",
        "/admin",
        "/account",
        "/admin-account",
      ],
    },
    sitemap: "https://www.jkorganics.co.ke/sitemap.xml",
  };
}
