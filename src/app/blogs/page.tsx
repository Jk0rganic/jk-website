import { seoMeta } from "@/utils/seo/seoMeta";
import Heros from "./hero";
import One from "./one";

export const metadata = seoMeta.blog;

export default function Page() {
  return (
    <>
      <Heros />
      <One />
    </>
  );
}
