import React from "react";
import useIsMobile from "@/hooks/useIsMobile";
import k from "./styles.module.scss";

export default function ShopCategorySkeleton() {
  const isMobile = useIsMobile(768);

  return (
    <div className={k.skeleton_shop}>
      {isMobile ? (
        <div className={k.title_mobile} />
      ) : (
        <>
          <div className={k.title} />
          <div className={k.title} />
          <div className={k.title} />
          <div className={k.title} />
          <div className={k.title} />
          <div className={k.title} />
          <div className={k.title} />
        </>
      )}
    </div>
  );
}
