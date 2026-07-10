import { seoMeta } from "@/utils/seo/seoMeta";
import Hero from "./hero";
import One from "./one";
import Two from "./two";

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
