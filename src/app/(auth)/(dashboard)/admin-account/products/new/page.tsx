"use client";

import { useRouter } from "next/navigation";
import ProductForm from "../comp/product-form";
import { BackLink } from "../../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <>
      <BackLink href="/admin-account/products" label="Back to products" />

      <div className={ui.pageHeader}>
        <div>
          <h2 className={ui.pageTitle}>Add new product</h2>
          <p className={ui.pageSubtitle}>
            Create a listing without opening WordPress.
          </p>
        </div>
      </div>

      <ProductForm
        mode="create"
        onSuccess={(productId: number) => {
          router.push(`/admin-account/products/${productId}`);
          router.refresh();
        }}
      />
    </>
  );
}
