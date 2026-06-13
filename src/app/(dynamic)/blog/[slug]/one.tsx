import Section from "@/comp/section/section";
import k from "./styles.module.scss";
import { formatDate } from "@/utils/formatDate";
import RelatedPosts from "../comp/relatedPosts/related-posts";

export default function One({ post }: { post: Blog }) {
  const postDate = post?.date || "";
  const categoryName = post?.categories?.nodes?.[0]?.name || "Uncategorized";
  const postTitle = post?.title || "Untitled Post";
  const postContent = post?.content || "No content available.";
  const postCategory = post?.categories?.nodes?.[0]?.slug || "uncategorized";
  const postSlug = post?.slug || ""; // current post slug

  return (
    <Section className={k.one}>
      <div className={k.cated}>
        <span>{formatDate(postDate)} </span>
        <span>{categoryName} </span>
      </div>
      <div className={k.wrapper}>
        <div className={k.content}>
          <h1>{postTitle}</h1>
          <div dangerouslySetInnerHTML={{ __html: postContent }} />
        </div>
        <RelatedPosts categorySlug={postCategory} currentSlug={postSlug} />
      </div>
    </Section>
  );
}
