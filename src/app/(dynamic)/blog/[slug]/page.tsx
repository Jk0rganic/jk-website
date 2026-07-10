import type { Metadata } from "next";
import Head from "next/head";
import Script from "next/script";
import { cache } from "react";
import { GET_POST_BY_SLUG } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import type { SinglePagePropsType } from "@/types/types";
import { blogSchema } from "@/utils/seo/schema";
import { siteMetadata } from "@/utils/seo/siteMetadata";
import Hero from "./hero";
import One from "./one";
import Two from "./two";

const stripHtml = (value?: string) => value?.replace(/<[^>]*>/g, "").trim();

const getPost = cache(async (slug: string): Promise<Blog> => {
  const { post } = await fetchGraphQL<{ post: Blog }, GetPostBySlugVariables>(
    GET_POST_BY_SLUG,
    { slug },
  );

  return post ?? null;
});

export async function generateMetadata({
  params,
}: SinglePagePropsType): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPost(slug);

  const shortDescription =
    stripHtml(post?.content)?.slice(0, 200) ||
    `Read ${post?.title} — a blog post by JK Organics.`;

  if (!post) {
    return siteMetadata({
      title: "Post Not Found | JK Organics Kenya",
      description:
        "The post you're looking for does not exist. Explore our latest blog posts.",
      url: `/blog/${slug}`,
    });
  }

  return siteMetadata({
    title: `${post.title} | JK Organics Kenya`,
    description: shortDescription,
    url: `/blog/${post.slug}`,
    image: post.featuredImage?.node?.sourceUrl || "",
    keywords: `${
      post.title
    }, organic skincare Kenya, JK Organics, ${post.categories?.nodes
      ?.map((c: { name: string }) => c.name)
      .join(", ")}`,
    author: `${post.author?.node?.name || ""}`,
  });
}

export default async function page({ params }: SinglePagePropsType) {
  const { slug } = await params;

  const post = await getPost(slug);
  const featuredImageUrl = post?.featuredImage?.node?.sourceUrl || "";
  return (
    <>
      {/* <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(blogSchema(post)),
          }}
        />
      </Head> */}
      <Hero backgroundImage={featuredImageUrl} />
      <One post={post} />
      <Two post={post} />
    </>
  );
}
