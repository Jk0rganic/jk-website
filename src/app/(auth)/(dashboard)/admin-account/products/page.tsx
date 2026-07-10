"use client";

import {
  AlertTriangle,
  Boxes,
  Eye,
  Package,
  PackageX,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatStockCount,
  getProductPublishStatus,
  type ProductInventoryItem,
  summarizeInventory,
} from "@/lib/admin/product-inventory";
import { formatPrice } from "@/utils/format-price";
import { AdminBadge } from "../components/ui/admin-badge";
import { AdminEmptyState } from "../components/ui/admin-empty-state";
import { AdminMetricCard } from "../components/ui/admin-metric-card";
import { AdminPanel } from "../components/ui/admin-panel";
import { AdminToolbar } from "../components/ui/admin-toolbar";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";
import k from "./products-list.module.scss";

const ITEMS_PER_PAGE = 10;
type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

function ProductThumbnail({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [broken, setBroken] = useState(false);

  if (!imageUrl || broken) {
    return (
      <div className={k.thumbPlaceholder} aria-hidden>
        <Package size={18} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={name}
      className={k.thumb}
      onError={() => setBroken(true)}
    />
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/products");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load products");
        }

        setProducts(data.products);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const summary = useMemo(() => summarizeInventory(products), [products]);
  const visibleProductCount = useMemo(
    () => products.filter((product) => product.status === "publish").length,
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (stockFilter === "low") {
        const qty = product.stockQuantity;
        if (product.stockStatus === "outofstock" || qty === null || qty > 5) {
          return false;
        }
      }

      if (stockFilter === "out" && product.stockStatus !== "outofstock") {
        return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const haystack = [product.name, product.sku, ...product.categories]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [products, search, stockFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const statusClass = {
    active: "success",
    draft: "neutral",
    other: "info",
  } as const;

  function getStockBadgeTone(product: ProductInventoryItem): BadgeTone {
    if (product.stockStatus === "outofstock") return "danger";
    if (product.stockQuantity !== null && product.stockQuantity <= 5) {
      return "warning";
    }
    return "success";
  }

  async function handleDeleteProduct(product: ProductInventoryItem) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This removes it from WooCommerce and cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingProductId(product.id);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      toast.success(`Deleted ${product.name}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${filteredProducts.length} shown of ${products.length} loaded products. Manage stock, pricing, and catalog visibility.`}
        action={
          <Link href="/admin-account/products/new" className={ui.btnPrimary}>
            <Plus size={16} aria-hidden />
            Add product
          </Link>
        }
      />

      <section className={k.metricGrid} aria-label="Catalog KPIs">
        <AdminMetricCard
          label="Total products"
          value={summary.total}
          icon={Boxes}
          tone="neutral"
          detail={`${summary.inStock} currently in stock`}
        />
        <AdminMetricCard
          label="Visible products"
          value={visibleProductCount}
          icon={Eye}
          tone="info"
          detail="Published in catalog"
        />
        <AdminMetricCard
          label="Low stock"
          value={summary.lowStock}
          icon={AlertTriangle}
          tone="warning"
          detail="Five units or fewer"
        />
        <AdminMetricCard
          label="Out of stock"
          value={summary.outOfStock}
          icon={PackageX}
          tone="danger"
          detail="Unavailable to customers"
        />
      </section>

      <AdminPanel
        title="Catalog table"
        description="Thumbnail, category, price, stock, and publish status in one compact view."
      >
        <AdminToolbar
          searchLabel="Search products"
          searchPlaceholder="Search products, SKU, or category"
          searchValue={search}
          onSearchChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        >
          <label className={k.filterControl}>
            <span>Stock</span>
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All stock levels</option>
              <option value="low">Low stock only</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
        </AdminToolbar>

        {loading && <p className={k.stateText}>Loading products...</p>}
        {error && <p className={k.error}>{error}</p>}

        {!loading && !error && !filteredProducts.length && (
          <AdminEmptyState
            title="No products match these filters"
            description="Adjust the search or stock filter to widen the catalog view."
            icon={Package}
          />
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <>
            <div className={k.tableWrap}>
              <table className={k.productsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const publishStatus = getProductPublishStatus(
                      product.status,
                    );

                    return (
                      <tr key={product.id}>
                        <td data-label="Product">
                          <div className={k.productCell}>
                            <ProductThumbnail
                              name={product.name}
                              imageUrl={product.imageUrl}
                            />
                            <div className={k.productMeta}>
                              <strong>{product.name}</strong>
                              <span>
                                {product.sku !== "—"
                                  ? `SKU: ${product.sku}`
                                  : product.type === "variable"
                                    ? "Variable product"
                                    : "Simple product"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Category">{product.primaryCategory}</td>
                        <td data-label="Price" className={k.price}>
                          {formatPrice(product.price)}
                        </td>
                        <td data-label="Stock">
                          <AdminBadge tone={getStockBadgeTone(product)}>
                            {formatStockCount(product)}
                          </AdminBadge>
                        </td>
                        <td data-label="Status">
                          <AdminBadge tone={statusClass[publishStatus.tone]}>
                            {publishStatus.label}
                          </AdminBadge>
                        </td>
                        <td data-label="Actions" className={k.actionsCell}>
                          <Link
                            href={`/admin-account/products/${product.id}`}
                            className={k.actionLink}
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            className={k.deleteAction}
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId === product.id}
                          >
                            {deletingProductId === product.id
                              ? "Deleting"
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={k.pagination}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </AdminPanel>
    </>
  );
}
