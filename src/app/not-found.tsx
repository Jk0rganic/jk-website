import NotFoundComp from "@/comp/404/not-found_comp";
import { seoMeta } from "@/utils/seo/seoMeta";

export const metadata = seoMeta.notFound;

export default function NotFound() {
  return <NotFoundComp />;
}
