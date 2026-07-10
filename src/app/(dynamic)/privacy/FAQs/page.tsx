import React from "react";
import { seoMeta } from "@/utils/seo/seoMeta";
import Hero from "./hero";
import One from "./one";

export const metadata = seoMeta.faqs;

export default function page() {
  return (
    <>
      <Hero />
      <One />
    </>
  );
}
