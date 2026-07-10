import { Suspense } from "react";
import { seoMeta } from "@/utils/seo/seoMeta";
import ResetPage from "./resetPage";

export const metadata = seoMeta.forgotPassword;

interface PageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPage searchParams={params} />
    </Suspense>
  );
}
