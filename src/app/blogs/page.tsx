import Heros from "./hero";
import One from "./one";
import { seoMeta } from "@/utils/seo/seoMeta";

export const metadata = seoMeta.blog;

export default function Page() {
  return (
    <>
      <Heros />
      <One />
    </>
  );
}
