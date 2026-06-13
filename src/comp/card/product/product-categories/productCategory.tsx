"use client";

import k from "./styles.module.scss";

type Category = {
  slug: string;
  name: string;
  count: number;
};

export default function ProductCategory({
  categories = [],
  activeCategory = "all", // controlled by parent
  onSelectCategory,
}: {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
}) {
  const filteredCategories = categories.filter(
    (cat) => cat.slug !== "uncategorized" && cat.count > 0,
  );

  return (
    <div className={k.category}>
      <button
        key="all"
        type="button"
        className={`${k.btn} ${activeCategory === "all" ? k.active : ""}`}
        onClick={() => onSelectCategory("all")}
      >
        All Products
      </button>

      {filteredCategories.map((cat) => (
        <button
          type="button"
          key={cat.slug}
          className={`${k.btn} ${activeCategory === cat.slug ? k.active : ""}`}
          onClick={() => onSelectCategory(cat.slug)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
