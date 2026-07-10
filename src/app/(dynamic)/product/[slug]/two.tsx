"use client";

import { useState } from "react";
import Section from "@/comp/section/section";
import Reviews from "../comp/two-comp/reviews/reviews";
import AdditionalInformation from "../comp/two-comp/single-pro-two/additional-information";
import TabButton from "../comp/two-comp/tab-button/tab-button";
import k from "./styles.module.scss"; // your CSS module

interface TwoProps {
  product: Product | null;
}

export default function Two({ product }: TwoProps) {
  const [activeTab, setActiveTab] = useState("description");
  const reviews_count = product?.reviewCount || 0;

  return (
    <Section className={k.two}>
      <TabButton
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reviews_count={reviews_count}
      />

      {/* Tab Content */}
      <div className={k.tabContent}>
        {activeTab === "description" && product?.description && (
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        )}

        {activeTab === "additional" && (
          <AdditionalInformation product={product} />
        )}

        {activeTab === "reviews" && <Reviews product={product} />}
      </div>
    </Section>
  );
}
