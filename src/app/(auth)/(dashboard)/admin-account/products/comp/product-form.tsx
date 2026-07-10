"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type ProductFormValues,
  productFormSchema,
  type VariationFormValues,
  variationFormSchema,
} from "@/lib/admin/product-schema";
import type { AdminProductDetail } from "@/lib/admin/product-service";
import { productDetailToFormValues } from "@/lib/admin/product-service";
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
  featured: false,
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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null);
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
  const productImagePreview = selectedImagePreviewUrl ?? product?.imageUrl;

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
              (item: {
                id: number;
                name: string;
                imageUrl: string | null;
              }) => ({
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

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function toggleCategory(categoryId: number) {
    const next = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    setValue("categoryIds", next, { shouldDirty: true });
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);
    setSelectedImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function createCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      toast.error("Enter a category name");
      return;
    }

    setCreatingCategory(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setCategories((current) => [...current, data.category]);
      setValue("categoryIds", [...selectedCategoryIds, data.category.id], {
        shouldDirty: true,
      });
      setNewCategoryName("");
      toast.success("Category added");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  async function uploadSelectedImage() {
    if (!selectedImageFile) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", selectedImageFile);

    const res = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to upload product image");
    }

    return data.media.id as number;
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
      const uploadedImageId = await uploadSelectedImage();
      const valuesToSave = uploadedImageId
        ? { ...values, imageId: uploadedImageId }
        : values;

      if (uploadedImageId) {
        setValue("imageId", uploadedImageId, { shouldDirty: true });
      }

      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valuesToSave),
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
      toast.error(
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      setSaving(false);
    }
  }

  const saveLabel = saving
    ? "Saving..."
    : mode === "create"
      ? "Create product"
      : "Save changes";

  return (
    <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={k.formLayout}>
        <div className={k.sections}>
          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>01</span>
              <div>
                <h2>Basics</h2>
                <p className={k.help}>
                  Give your product a clear name customers will recognize.
                </p>
              </div>
            </div>

            <label className={k.field}>
              <span>Product name</span>
              <input
                {...register("name")}
                placeholder="e.g. Organic Shea Butter"
              />
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
              <input
                {...register("sku")}
                placeholder="Optional internal code"
              />
            </label>
          </section>

          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>02</span>
              <div>
                <h2>Pricing</h2>
                <p className={k.help}>Prices are in Kenyan Shillings (KSh).</p>
              </div>
            </div>

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
                This product has size or variant options. Set prices for each
                option in Variations.
              </p>
            )}
          </section>

          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>03</span>
              <div>
                <h2>Inventory</h2>
                <p className={k.help}>
                  Control availability and quantity tracking.
                </p>
              </div>
            </div>

            {!isVariable ? (
              <>
                <label className={k.checkbox}>
                  <input type="checkbox" {...register("manageStock")} />
                  <span>Track how many units are left</span>
                </label>

                {manageStock && (
                  <label className={k.field}>
                    <span>Units in stock</span>
                    <input
                      {...register("stockQuantity")}
                      inputMode="numeric"
                      placeholder="25"
                    />
                    {errors.stockQuantity && (
                      <em>{errors.stockQuantity.message}</em>
                    )}
                  </label>
                )}

                <label className={k.checkbox}>
                  <input type="checkbox" {...register("inStock")} />
                  <span>Available for customers to buy</span>
                </label>
              </>
            ) : (
              <p className={k.note}>
                Inventory for this product is managed per variation.
              </p>
            )}
          </section>

          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>04</span>
              <div>
                <h2>Images</h2>
                <p className={k.help}>
                  Choose the main image shown on product cards.
                </p>
              </div>
            </div>

            <div className={k.imageUpload}>
              <div className={k.imagePreview}>
                {productImagePreview ? (
                  <img src={productImagePreview} alt="" />
                ) : (
                  <span>No image selected</span>
                )}
              </div>

              <label className={k.field}>
                <span>Main image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </section>

          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>05</span>
              <div>
                <h2>Organization</h2>
                <p className={k.help}>
                  Choose where this product appears and whether it is visible.
                </p>
              </div>
            </div>

            <div className={k.categoryCreate}>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="New category name"
              />
              <button
                type="button"
                onClick={createCategory}
                disabled={creatingCategory}
              >
                {creatingCategory ? "Adding..." : "Add category"}
              </button>
            </div>

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

            <label className={k.checkbox}>
              <input type="checkbox" {...register("published")} />
              <span>Show this product on the website</span>
            </label>

            <label className={k.checkbox}>
              <input type="checkbox" {...register("featured")} />
              <span>Feature this product in the site-wide spotlight popup</span>
            </label>
          </section>

          <section className={k.section}>
            <div className={k.sectionHeader}>
              <span>06</span>
              <div>
                <h2>Linked products</h2>
                <p className={k.help}>
                  Recommend other products customers may want to buy with this
                  one.
                </p>
              </div>
            </div>

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

          {isVariable && variations.length > 0 && (
            <section className={k.section}>
              <div className={k.sectionHeader}>
                <span>07</span>
                <div>
                  <h2>Variations</h2>
                  <p className={k.help}>
                    Update price and stock for each size or option.
                  </p>
                </div>
              </div>

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
                      <span>Track stock for this variant</span>
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
                          updateVariation(
                            variation.id,
                            "inStock",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Available to buy</span>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={k.saveRail} aria-label="Product save actions">
          <span className={k.railEyebrow}>
            {mode === "create" ? "New product" : "Editing product"}
          </span>
          <strong>{product?.name || "Unsaved product"}</strong>
          <p>
            Saves catalog fields, image changes, linked products, and variation
            updates.
          </p>
          <button type="submit" disabled={saving}>
            {saveLabel}
          </button>
        </aside>
      </div>

      <div className={k.actions}>
        <button type="submit" disabled={saving}>
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
