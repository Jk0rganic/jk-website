import k from "./styles.module.scss";
import { formatDate } from "@/utils/formatDate";

interface BlogComment {
  id: string;
  author: {
    node: {
      name: string;
    };
  };
  date: string;
  content: string;
}

export default function BlogComments({ post }: { post: Blog | null }) {
  const reviewNodes = post?.comments?.nodes ?? [];

  return (
    <div className={k.reviews_blog}>
      <h5>Comments ({reviewNodes.length})</h5>

      {reviewNodes.length === 0 && (
        <p>No comments yet. Be the first to share your experience!</p>
      )}

      {reviewNodes.length > 0 && (
        <ul>
          {reviewNodes.map((review: BlogComment) => (
            <li key={review.id}>
              <div className={k.review_author}>
                <h6>{review.author?.node?.name ?? "Anonymous"}</h6>

                <span>{review.date ? formatDate(review.date) : ""}</span>
              </div>

              <div
                dangerouslySetInnerHTML={{
                  __html: review.content || "No comment provided.",
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
