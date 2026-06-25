"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import {
  formatStockCount,
  getProductPublishStatus,
  summarizeInventory,
  type ProductInventoryItem,
} from "@/lib/admin/product-inventory";
import { PageHeader } from "../components/ui/page-header";
import ui from "../components/ui/admin-ui.module.scss";
import k from "./products-list.module.scss";

const ITEMS_PER_PAGE = 10;

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
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const summary = useMemo(() => summarizeInventory(products), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (stockFilter === "low") {
        const qty = product.stockQuantity;
        if (
          product.stockStatus === "outofstock" ||
          qty === null ||
          qty > 5
        ) {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stockFilter]);

  const statusClass = {
    active: k.badgeActive,
    draft: k.badgeDraft,
    other: k.badgeOther,
  } as const;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog, stock levels, and pricing."
      />

      <div className={ui.statGrid}>
        {[
          { label: "Published", value: summary.total },
          { label: "In stock", value: summary.inStock },
          { label: "Low stock", value: summary.lowStock },
          { label: "Out of stock", value: summary.outOfStock },
        ].map((item) => (
          <article key={item.label} className={ui.statCard}>
            <span className={ui.statLabel}>{item.label}</span>
            <div className={ui.statValue}>{item.value}</div>
          </article>
        ))}
      </div>

      <section className={k.productListCard}>
        <div className={k.listHeader}>
          <h2>Products list</h2>
          <div className={k.listActions}>
            <Link href="/admin-account/products/new" className={k.addBtn}>
              + Add
            </Link>
          </div>
        </div>

        <div className={k.toolbar}>
          <input
            type="search"
            placeholder="Search products or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={k.searchInput}
          />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={k.filterSelect}
          >
            <option value="all">All stock levels</option>
            <option value="low">Low stock only</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {loading && <p className={k.loading}>Loading products…</p>}
        {error && <p className={k.error}>{error}</p>}

        {!loading && !error && !filteredProducts.length && (
          <p className={k.empty}>No products match your filters.</p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <>
            <div className={k.tableWrap}>
              <table className={k.table}>
                <thead>
                  <tr>
                    <th>Product name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const publishStatus = getProductPublishStatus(product.status);

                    return (
                      <tr key={product.id}>
                        <td>
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
                        <td>{product.primaryCategory}</td>
                        <td className={k.price}>{formatPrice(product.price)}</td>
                        <td className={k.stock}>
                          {formatStockCount(product)}
                        </td>
                        <td>
                          <span
                            className={statusClass[publishStatus.tone]}
                          >
                            {publishStatus.label}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/admin-account/products/${product.id}`}
                            className={k.detailsLink}
                          >
                            Details
                          </Link>
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
      </section>
    </>
  );
}
