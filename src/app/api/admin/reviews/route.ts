import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  computeReviewSummary,
  fetchAdminReviews,
  filterAdminReviews,
} from "@/lib/admin/review-service";

export async function GET(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const params = new URL(request.url).searchParams;

  try {
    const reviews = filterAdminReviews(await fetchAdminReviews(), {
      rating: params.get("rating"),
      status: params.get("status"),
      search: params.get("search"),
      product: params.get("product"),
      after: params.get("after"),
      before: params.get("before"),
    });

    return Response.json({
      reviews,
      summary: computeReviewSummary(reviews),
    });
  } catch (err) {
    console.error("Failed to fetch admin reviews", err);
    return Response.json(
      { error: "Failed to fetch admin reviews" },
      { status: 500 },
    );
  }
}
