interface CatCatProductProps {
  product: Product;
  k: any;
}

export default function CatCatProduct({ product, k }: CatCatProductProps) {
  if (!product) return null;

  const categories = product.productCategories?.nodes || [];
  const categoryNames = categories
    .map((cat: { name: string }) => cat.name)
    .join(", ");

  return (
    <div className={k.category_wp}>
      {categoryNames ? (
        <span>{categoryNames}</span>
      ) : (
        <span>Uncategorized</span>
      )}
    </div>
  );
}
