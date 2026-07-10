"use client";

import { useRouter } from "next/navigation";
import useIsMobile from "@/hooks/useIsMobile";
import k from "./styles.module.scss";

export interface ShopCategoryItem {
  slug: string;
  name: string;
  count?: number;
}

interface ShopCategoryProps {
  categories: ShopCategoryItem[];
  activeCategory: string;
}

export default function ShopCategory({
  categories = [],
  activeCategory = "all",
}: ShopCategoryProps) {
  const isMobile = useIsMobile(768);
  const router = useRouter();

  const filteredCategories = categories.filter(
    (cat) => cat.slug !== "uncategorized" && (cat.count ?? 0) > 0,
  );

  const handleSelect = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  return (
    <div className={k.category}>
      <h4>BROWSE</h4>

      {isMobile ? (
        <div className={k.mobile_cat}>
          <select
            className={k.select}
            value={activeCategory}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="all">All Products</option>

            {filteredCategories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name} ({cat.count ?? 0})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`${k.btn} ${activeCategory === "all" ? k.active : ""}`}
            onClick={() => handleSelect("all")}
          >
            All Products
          </button>

          {filteredCategories.map((cat) => (
            <button
              type="button"
              key={cat.slug}
              className={`${k.btn} ${activeCategory === cat.slug ? k.active : ""}`}
              onClick={() => handleSelect(cat.slug)}
            >
              {cat.name} ({cat.count ?? 0})
            </button>
          ))}
        </>
      )}
    </div>
  );
}
