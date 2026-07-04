import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";

export type AdminReview = {
  id: number | string;
  productId: number;
  productName: string;
  productSlug?: string;
  reviewer: string;
  reviewerEmail: string;
  rating: number;
  date: string;
  status: string;
  content: string;
  productImage?: string;
};

export type AdminReviewSummary = {
  total: number;
  averageRating: number;
  lowRatingCount: number;
  pendingCount: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type AdminReviewFilters = {
  search?: string | null;
  rating?: string | number | null;
  status?: string | null;
  product?: string | number | null;
  after?: string | null;
  before?: string | null;
};

const ADMIN_REVIEWS_QUERY = `
  query AdminReviews($first: Int = 100) {
    comments(first: $first) {
      nodes {
        id
        databaseId
        content(format: RENDERED)
        date
        dateGmt
        status
        approved
        # rating metadata is exposed through commentMeta key/value nodes.
        commentMeta {
          nodes {
            key
            value
          }
        }
        author {
          node {
            name
            email
          }
        }
        commentedOn {
          node {
            ... on Product {
              databaseId
              name
              title
              slug
              image {
                sourceUrl
                mediaItemUrl
              }
              featuredImage {
                node {
                  sourceUrl
                  mediaItemUrl
                }
              }
            }
            ... on Post {
              databaseId
              title
              slug
              featuredImage {
                node {
                  sourceUrl
                  mediaItemUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RecordLike = Record<string, unknown>;

type AdminReviewsResponse = {
  comments?: {
    nodes?: unknown[];
  };
};

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  const data = await fetchGraphQL<AdminReviewsResponse>(ADMIN_REVIEWS_QUERY, {
    first: 100,
  });

  return (data.comments?.nodes ?? [])
    .map(mapCommentToAdminReview)
    .filter((review) => review.productId > 0);
}

export function mapCommentToAdminReview(comment: unknown): AdminReview {
  const item = asRecord(comment);
  const author = firstRecord(
    getRecord(item, "author")?.node,
    getRecord(item, "author"),
  );
  const product = firstRecord(
    getRecord(getRecord(item, "commentedOn"), "node"),
    getRecord(item, "product"),
    getRecord(item, "post"),
  );
  const image = firstString(
    getRecord(product, "image")?.sourceUrl,
    getRecord(product, "image")?.mediaItemUrl,
    getRecord(getRecord(product, "featuredImage"), "node")?.sourceUrl,
    getRecord(getRecord(product, "featuredImage"), "node")?.mediaItemUrl,
  );

  return {
    id: firstNumberOrString(item.databaseId, item.id) ?? "",
    productId:
      firstNumber(product.databaseId, product.productId, product.id) ?? 0,
    productName:
      firstString(product.name, product.title, item.productName) ??
      "Unknown product",
    productSlug: firstString(product.slug, item.productSlug),
    reviewer:
      firstString(
        getRecord(author, "node")?.name,
        author.name,
        item.authorName,
        item.reviewer,
      ) ?? "Anonymous",
    reviewerEmail:
      firstString(
        getRecord(author, "node")?.email,
        author.email,
        item.authorEmail,
        item.reviewerEmail,
      ) ?? "",
    rating:
      firstNumber(item.rating, item.reviewRating, ratingFromMeta(item)) ?? 0,
    date: firstString(item.date, item.dateGmt, item.createdAt) ?? "",
    status: normalizeStatus(
      firstString(item.status, item.approved, item.approvalStatus),
    ),
    content: stripHtml(
      firstString(item.content, item.review, item.comment) ?? "",
    ),
    ...(image ? { productImage: image } : {}),
  };
}

export function computeReviewSummary(
  reviews: AdminReview[],
): AdminReviewSummary {
  const total = reviews.length;
  const ratedReviews = reviews.filter((review) => review.rating > 0);
  const ratingTotal = ratedReviews.reduce(
    (sum, review) => sum + review.rating,
    0,
  );
  const ratingDistribution: AdminReviewSummary["ratingDistribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  return {
    total,
    averageRating: ratedReviews.length
      ? Math.round((ratingTotal / ratedReviews.length) * 10) / 10
      : 0,
    lowRatingCount: ratedReviews.filter((review) => review.rating <= 2).length,
    pendingCount: reviews.filter((review) => isPendingStatus(review.status))
      .length,
    ratingDistribution,
  };
}

export function filterAdminReviews(
  reviews: AdminReview[],
  filters: AdminReviewFilters,
): AdminReview[] {
  const search = filters.search?.trim().toLowerCase();
  const rating = toNumber(filters.rating);
  const status = filters.status?.trim().toLowerCase();
  const product = filters.product?.toString().trim().toLowerCase();
  const after = parseDateBoundary(filters.after, "start");
  const before = parseDateBoundary(filters.before, "end");

  return reviews.filter((review) => {
    if (search && !matchesSearch(review, search)) return false;
    if (rating !== undefined && review.rating !== rating) return false;
    if (status && review.status.toLowerCase() !== status) return false;
    if (product && !matchesProduct(review, product)) return false;

    const reviewDate = Date.parse(review.date);
    if (
      after !== undefined &&
      (!Number.isFinite(reviewDate) || reviewDate < after)
    ) {
      return false;
    }
    if (
      before !== undefined &&
      (!Number.isFinite(reviewDate) || reviewDate > before)
    ) {
      return false;
    }

    return true;
  });
}

function matchesSearch(review: AdminReview, search: string) {
  return [
    review.reviewer,
    review.reviewerEmail,
    review.productName,
    review.productSlug,
    review.content,
  ].some((value) => value?.toLowerCase().includes(search));
}

function matchesProduct(review: AdminReview, product: string) {
  return (
    String(review.productId) === product ||
    review.productSlug?.toLowerCase() === product ||
    review.productName.toLowerCase().includes(product)
  );
}

function isPendingStatus(status: string) {
  const value = status.toLowerCase();
  return Boolean(
    value && !["approve", "approved", "publish", "published"].includes(value),
  );
}

function normalizeStatus(status: string | undefined) {
  if (!status) return "";
  const value = status.toLowerCase();

  if (["1", "true", "approve", "approved"].includes(value)) return "approved";
  if (["0", "false", "hold", "unapproved"].includes(value)) return "pending";

  return value;
}

function ratingFromMeta(item: RecordLike) {
  const meta = firstArray(
    item.commentMeta,
    item.metaData,
    item.meta_data,
    item.meta,
  );
  if (!meta) return undefined;

  for (const entry of meta) {
    const record = asRecord(entry);
    if (firstString(record.key, record.name)?.toLowerCase() === "rating") {
      return firstNumber(record.value);
    }
  }

  return undefined;
}

function firstArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value;

    if (isRecord(value) && Array.isArray(value.nodes)) return value.nodes;
  }

  return undefined;
}

function parseDateBoundary(
  value: string | null | undefined,
  boundary: "start" | "end",
) {
  if (!value) return undefined;
  const normalized =
    boundary === "end" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T23:59:59.999`
      : value;
  const timestamp = Date.parse(normalized);

  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function firstRecord(...values: unknown[]): RecordLike {
  for (const value of values) {
    const record = getRecord(value);
    if (record) return record;
  }

  return {};
}

function getRecord(value: unknown, key?: string): RecordLike | undefined {
  const target = key && isRecord(value) ? value[key] : value;
  return isRecord(target) ? target : undefined;
}

function asRecord(value: unknown): RecordLike {
  return getRecord(value) ?? {};
}

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return undefined;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = toNumber(value);
    if (number !== undefined) return number;
  }

  return undefined;
}

function firstNumberOrString(...values: unknown[]) {
  for (const value of values) {
    const number = toNumber(value);
    if (number !== undefined) return number;
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  return undefined;
}
