"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminProductDetail } from "@/lib/admin/product-service";
import ProductForm from "../comp/product-form";
import { BackLink } from "../../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

export default function EditProductPage({ productId }: { productId: number }) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load product");
        }

        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  if (loading) return <p className={ui.muted}>Loading product…</p>;
  if (error) return <p className={ui.error}>{error}</p>;
  if (!product) return <p className={ui.empty}>Product not found.</p>;

  return (
    <>
      <BackLink href="/admin-account/products" label="Back to products" />

      <div className={ui.pageHeader}>
        <div>
          <h2 className={ui.pageTitle}>Edit product</h2>
          <p className={ui.pageSubtitle}>{product.name}</p>
        </div>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              width: 72,
              height: 72,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e8ebe9",
            }}
          />
        )}
      </div>

      <ProductForm
        mode="edit"
        product={product}
        onSuccess={() => {
          router.push("/admin-account/products");
          router.refresh();
        }}
      />
    </>
  );
}
