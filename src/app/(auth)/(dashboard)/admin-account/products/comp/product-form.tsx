"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  productFormSchema,
  type ProductFormValues,
  type VariationFormValues,
  variationFormSchema,
} from "@/lib/admin/product-schema";
import type { AdminProductDetail } from "@/lib/admin/product-service";
import {
  productDetailToFormValues,
} from "@/lib/admin/product-service";
import LinkedProductsPicker, {
  type LinkedProductOption,
} from "./linked-products-picker";
import k from "./product-form.module.scss";

type CategoryOption = {
  id: number;
  name: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  product?: AdminProductDetail;
  onSuccess: (productId: number) => void;
};

const defaultValues: ProductFormValues = {
  name: "",
  shortDescription: "",
  description: "",
  sku: "",
  regularPrice: "",
  salePrice: "",
  manageStock: true,
  stockQuantity: "",
  inStock: true,
  published: true,
  categoryIds: [],
  relatedProductIds: [],
  crossSellProductIds: [],
  upsellProductIds: [],
};

export default function ProductForm({
  mode,
  product,
  onSuccess,
}: ProductFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [productOptions, setProductOptions] = useState<LinkedProductOption[]>(
    [],
  );
  const [variations, setVariations] = useState<VariationFormValues[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? productDetailToFormValues(product) : defaultValues,
  });

  const manageStock = watch("manageStock");
  const selectedCategoryIds = watch("categoryIds") ?? [];
  const relatedProductIds = watch("relatedProductIds") ?? [];
  const crossSellProductIds = watch("crossSellProductIds") ?? [];
  const upsellProductIds = watch("upsellProductIds") ?? [];
  const isVariable = product?.type === "variable";

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories);
        }
      } catch {
        toast.error("Could not load categories");
      }
    }

    async function loadProducts() {
      try {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (res.ok) {
          setProductOptions(
            data.products.map(
              (item: { id: number; name: string; imageUrl: string | null }) => ({
                id: item.id,
                name: item.name,
                imageUrl: item.imageUrl,
              }),
            ),
          );
        }
      } catch {
        toast.error("Could not load products for linking");
      }
    }

    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    if (product?.variations?.length) {
      setVariations(
        product.variations.map((variation) => ({
          id: variation.id,
          name: variation.label,
          regularPrice: variation.regularPrice,
          salePrice: variation.salePrice,
          manageStock: variation.manageStock,
          stockQuantity:
            variation.stockQuantity !== null
              ? String(variation.stockQuantity)
              : "",
          inStock: variation.inStock,
        })),
      );
    }
  }, [product]);

  function toggleCategory(categoryId: number) {
    const next = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    setValue("categoryIds", next, { shouldDirty: true });
  }

  function updateVariation(
    variationId: number,
    field: keyof VariationFormValues,
    value: string | boolean,
  ) {
    setVariations((current) =>
      current.map((variation) =>
        variation.id === variationId
          ? { ...variation, [field]: value }
          : variation,
      ),
    );
  }

  async function onSubmit(values: ProductFormValues) {
    setSaving(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      const productId = mode === "create" ? data.product.id : product?.id;

      if (isVariable && variations.length && productId) {
        for (const variation of variations) {
          const parsed = variationFormSchema.safeParse(variation);
          if (!parsed.success) {
            throw new Error(`Invalid data for ${variation.name}`);
          }
        }

        const variationRes = await fetch(
          `/api/admin/products/${productId}/variations`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variations }),
          },
        );

        const variationData = await variationRes.json();

        if (!variationRes.ok) {
          throw new Error(
            variationData.error || "Product saved but variations failed",
          );
        }
      }

      toast.success(
        mode === "create" ? "Product created" : "Product updated successfully",
      );
      onSuccess(productId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
      <section className={k.section}>
        <h2>Basics</h2>
        <p className={k.help}>
          Give your product a clear name customers will recognize.
        </p>

        <label className={k.field}>
          <span>Product name</span>
          <input {...register("name")} placeholder="e.g. Organic Shea Butter" />
          {errors.name && <em>{errors.name.message}</em>}
        </label>

        <label className={k.field}>
          <span>Short summary</span>
          <textarea
            {...register("shortDescription")}
            rows={3}
            placeholder="A quick one-liner shown on product cards"
          />
        </label>

        <label className={k.field}>
          <span>Full description</span>
          <textarea
            {...register("description")}
            rows={6}
            placeholder="Ingredients, benefits, how to use..."
          />
        </label>

        <label className={k.field}>
          <span>Product code (SKU)</span>
          <input {...register("sku")} placeholder="Optional internal code" />
        </label>
      </section>

      <section className={k.section}>
        <h2>Pricing</h2>
        <p className={k.help}>Prices are in Kenyan Shillings (KSh).</p>

        <div className={k.row}>
          <label className={k.field}>
            <span>Selling price</span>
            <input
              {...register("regularPrice")}
              inputMode="decimal"
              placeholder="1200"
              disabled={isVariable}
            />
            {errors.regularPrice && <em>{errors.regularPrice.message}</em>}
          </label>

          <label className={k.field}>
            <span>Discount price (optional)</span>
            <input
              {...register("salePrice")}
              inputMode="decimal"
              placeholder="999"
              disabled={isVariable}
            />
            {errors.salePrice && <em>{errors.salePrice.message}</em>}
          </label>
        </div>

        {isVariable && (
          <p className={k.note}>
            This product has size or variant options. Set prices for each option
            below.
          </p>
        )}
      </section>

      {!isVariable && (
        <section className={k.section}>
          <h2>Stock</h2>

          <label className={k.checkbox}>
            <input type="checkbox" {...register("manageStock")} />
            Track how many units are left
          </label>

          {manageStock && (
            <label className={k.field}>
              <span>Units in stock</span>
              <input
                {...register("stockQuantity")}
                inputMode="numeric"
                placeholder="25"
              />
              {errors.stockQuantity && <em>{errors.stockQuantity.message}</em>}
            </label>
          )}

          <label className={k.checkbox}>
            <input type="checkbox" {...register("inStock")} />
            Available for customers to buy
          </label>
        </section>
      )}

      {isVariable && variations.length > 0 && (
        <section className={k.section}>
          <h2>Variants</h2>
          <p className={k.help}>
            Update price and stock for each size or option.
          </p>

          <div className={k.variationList}>
            {variations.map((variation) => (
              <div key={variation.id} className={k.variationCard}>
                <h3>{variation.name}</h3>
                <div className={k.row}>
                  <label className={k.field}>
                    <span>Price</span>
                    <input
                      value={variation.regularPrice}
                      onChange={(e) =>
                        updateVariation(
                          variation.id,
                          "regularPrice",
                          e.target.value,
                        )
                      }
                    />
                  </label>
                  <label className={k.field}>
                    <span>Discount price</span>
                    <input
                      value={variation.salePrice}
                      onChange={(e) =>
                        updateVariation(
                          variation.id,
                          "salePrice",
                          e.target.value,
                        )
                      }
                    />
                  </label>
                </div>
                <label className={k.checkbox}>
                  <input
                    type="checkbox"
                    checked={variation.manageStock}
                    onChange={(e) =>
                      updateVariation(
                        variation.id,
                        "manageStock",
                        e.target.checked,
                      )
                    }
                  />
                  Track stock for this variant
                </label>
                {variation.manageStock && (
                  <label className={k.field}>
                    <span>Units in stock</span>
                    <input
                      value={variation.stockQuantity}
                      onChange={(e) =>
                        updateVariation(
                          variation.id,
                          "stockQuantity",
                          e.target.value,
                        )
                      }
                    />
                  </label>
                )}
                <label className={k.checkbox}>
                  <input
                    type="checkbox"
                    checked={variation.inStock}
                    onChange={(e) =>
                      updateVariation(variation.id, "inStock", e.target.checked)
                    }
                  />
                  Available to buy
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={k.section}>
        <h2>Categories</h2>
        <p className={k.help}>Choose where this product appears in the shop.</p>

        <div className={k.categoryGrid}>
          {categories.map((category) => (
            <label key={category.id} className={k.categoryChip}>
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </section>

      <section className={k.section}>
        <h2>Linked products</h2>
        <p className={k.help}>
          Recommend other products customers may want to buy with this one — the
          same linked-product settings as WooCommerce.
        </p>

        <LinkedProductsPicker
          label="Frequently bought together"
          help="Shown as cross-sells in the cart when a customer adds this product."
          value={crossSellProductIds}
          options={productOptions}
          excludeId={product?.id}
          onChange={(ids) =>
            setValue("crossSellProductIds", ids, { shouldDirty: true })
          }
        />

        <LinkedProductsPicker
          label="Related products"
          help="Shown in the Related Products section on this product's page."
          value={relatedProductIds}
          options={productOptions}
          excludeId={product?.id}
          onChange={(ids) =>
            setValue("relatedProductIds", ids, { shouldDirty: true })
          }
        />

        <LinkedProductsPicker
          label="Upsells"
          help="Suggested as premium or alternative options on the product page."
          value={upsellProductIds}
          options={productOptions}
          excludeId={product?.id}
          onChange={(ids) =>
            setValue("upsellProductIds", ids, { shouldDirty: true })
          }
        />
      </section>

      <section className={k.section}>
        <h2>Visibility</h2>
        <label className={k.checkbox}>
          <input type="checkbox" {...register("published")} />
          Show this product on the website
        </label>
        <p className={k.help}>
          Turn off to hide while you are still preparing the listing.
        </p>
      </section>

      <div className={k.actions}>
        <button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
