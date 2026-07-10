import Link from "next/link";
import { GET_RELATED_POSTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import k from "./styles.module.scss";

type RelatedPostsResponse = {
  posts: {
    edges: {
      node: Blog;
    }[];
  };
};

export default async function RelatedPosts({
  categorySlug,
  currentSlug,
}: {
  categorySlug: string;
  currentSlug: string;
}) {
  const data = await fetchGraphQL<RelatedPostsResponse>(GET_RELATED_POSTS, {
    categorySlug,
  });

  const filteredPosts =
    data?.posts?.edges?.filter((post) => post.node.slug !== currentSlug) ?? [];

  return (
    <div className={k.Related_posts}>
      <h2>Related Posts</h2>

      <ul>
        {filteredPosts.map((post) => (
          <li key={post.node.slug}>
            <Link href={`/blog/${post.node.slug}`}>{post.node.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
