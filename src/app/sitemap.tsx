import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";

const baseUrl = "https://jkorganics.co.ke";

export const GET_PRODUCTS_SITEMAP = `
  query GetProducts($first: Int, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        ... on Product {
          slug
          date
          modified
        }
      }
    }
  }
`;

export const GET_BLOG_POSTS_SITEMAP = `
  query GetBlogPosts($first: Int) {
    posts(first: $first) {
      nodes {
        slug
        date
        modified
      }
    }
  }
`;

interface SitemapNode {
  slug: string;
  date: string;
  modified: string;
}

export default async function sitemap() {
  const [productData, blogData] = await Promise.all([
    fetchGraphQL<{ products: { nodes: SitemapNode[] } }>(GET_PRODUCTS_SITEMAP, {
      first: 100,
    }),
    fetchGraphQL<{ posts: { nodes: SitemapNode[] } }>(GET_BLOG_POSTS_SITEMAP, {
      first: 100,
    }),
  ]);

  const products = productData?.products?.nodes ?? [];
  const blogs = blogData?.posts?.nodes ?? [];

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.modified || p.date),
  }));

  const blogUrls = blogs.map((b) => ({
    url: `${baseUrl}/blog/${b.slug}`,
    lastModified: new Date(b.modified || b.date),
  }));

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    ...productUrls,
    ...blogUrls,
  ];
}
