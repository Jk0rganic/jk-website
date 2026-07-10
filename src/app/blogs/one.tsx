import BlogCard from "@/comp/card/blog-card/blog-card";
import Section from "@/comp/section/section";
import { GET_POSTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import k from "./styles.module.scss";

export default async function One() {
  const data = await fetchGraphQL<{ posts: { nodes: Blog[] } }>(GET_POSTS, {
    first: 4,
  });

  const posts = data?.posts?.nodes || [];

  return (
    <Section className={k.one}>
      <div className={k.card_wrapper}>
        {posts.length === 0 && (
          <p className={k.empty}>No posts available at the moment.</p>
        )}

        {posts.map((post) => (
          <BlogCard key={post.slug} blog={post} />
        ))}
      </div>
    </Section>
  );
}
