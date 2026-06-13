import React from "react";
import One from "./one";
import Hero from "./hero";
import { seoMeta } from "@/utils/seo/seoMeta";

export const metadata = seoMeta.faqs;

export default function page() {
  return (
    <>
      <Hero />
      <One />
    </>
  );
}
