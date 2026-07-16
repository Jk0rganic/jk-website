import { z } from "zod";
import { fetchWoo } from "@/lib/fetch/fetchRest";

const reviewSchema = z.object({
  productId: z.number().int().positive(),
  reviewer: z.string().trim().min(2).max(100),
  reviewerEmail: z.email(),
  review: z.string().trim().min(2).max(5000),
  rating: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid review", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const review = await fetchWoo("products/reviews", {
      method: "POST",
      body: {
        product_id: parsed.data.productId,
        reviewer: parsed.data.reviewer,
        reviewer_email: parsed.data.reviewerEmail,
        review: parsed.data.review,
        rating: parsed.data.rating,
      },
      noCache: true,
    });

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit product review", error);
    return Response.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
