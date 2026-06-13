import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import Section from "@/comp/section/section";
import BlogCard from "@/comp/card/blog-card/blog-card";
import k from "./styles.module.scss";
import { GET_POSTS } from "@/graphql/graphql";

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
