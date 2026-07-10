import { Suspense } from "react";
import { seoMeta } from "@/utils/seo/seoMeta";
import SignUpPage from "./comp/signUpPage";

export const metadata = seoMeta.signup;

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPage />
    </Suspense>
  );
}
