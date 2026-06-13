import React from "react";
import k from "./styles.module.scss";
import useIsMobile from "@/hooks/useIsMobile";

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
