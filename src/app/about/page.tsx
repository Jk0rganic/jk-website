import { seoMeta } from "@/utils/seo/seoMeta";
import One from "./one";
import Two from "./two";
import Hero from "./hero";

export const metadata = seoMeta.about;

export default async function Page() {
  return (
    <>
      <Hero />
      <Two />
      <One />
    </>
  );
}
