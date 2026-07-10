import { PostReviewForm } from "@/comp/comments-form/comments-form";
import Section from "@/comp/section/section";
import BlogComments from "../comp/blog-comp/blog-comments";
import k from "./styles.module.scss";

export default function Two({ post }: { post: Blog | null }) {
  const productId = post?.databaseId || 0;

  return (
    <Section className={k.two}>
      <BlogComments post={post} />
      <PostReviewForm productId={productId} />
    </Section>
  );
}
