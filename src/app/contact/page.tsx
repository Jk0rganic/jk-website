import Heros from "./hero";
import One from "./one";
import Two from "./two";
import { seoMeta } from "@/utils/seo/seoMeta";

export const metadata = seoMeta.contact;

export default function Page() {
  return (
    <>
      <Heros />
      <One />
      <Two />
    </>
  );
}
