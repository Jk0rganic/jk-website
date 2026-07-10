import type { Metadata } from "next";
import { cache } from "react";
import { GET_PAGE } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import type { SinglePagePropsType } from "@/types/types";
import { siteMetadata } from "@/utils/seo/siteMetadata";
import Hero from "./hero";
import One from "./one";

export interface PageProps {
  slug: string;
  title: string;
  content?: string;
}
interface GetPageVariables {
  slug: string;
}

const getPage = cache(async (slug: string): Promise<PageProps | null> => {
  const { page } = await fetchGraphQL<{ page: PageProps }, GetPageVariables>(
    GET_PAGE,
    { slug },
  );

  return page ?? null;
});

export async function generateMetadata({
  params,
}: SinglePagePropsType): Promise<Metadata> {
  const { slug } = await params;

  const pageData = await getPage(slug);

  const plainText =
    pageData?.content
      ?.replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim() || "";

  const shortDescription =
    plainText.length > 200
      ? plainText.slice(0, 200).split(" ").slice(0, -1).join(" ") + "..."
      : plainText;

  return siteMetadata({
    title:
      `${pageData?.title} - JK Organics Kenya` ||
      "Privacy Policy | JK Organics Kenya",
    description: shortDescription,
    url: `/privacy/${slug}`,
    robots: "noindex, nofollow",
  });
}

export default async function page({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  const pageData = await getPage(slug);
  const content = pageData?.content ?? "";
  return (
    <>
      <Hero />
      <One content={content} />
    </>
  );
}
