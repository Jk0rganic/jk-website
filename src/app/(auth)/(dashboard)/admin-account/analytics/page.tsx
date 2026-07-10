import { Suspense } from "react";
import { seoMeta } from "@/utils/seo/seoMeta";
import AnalyticsPage from "./comp/analytics-page";

export const metadata = {
  ...seoMeta.account,
  title: "Analytics | JK Organics Admin",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPage />
    </Suspense>
  );
}
