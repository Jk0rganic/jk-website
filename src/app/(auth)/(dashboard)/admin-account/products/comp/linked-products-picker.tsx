"use client";

import { useMemo, useState } from "react";
import k from "./product-form.module.scss";

export type LinkedProductOption = {
  id: number;
  name: string;
  imageUrl: string | null;
};

type LinkedProductsPickerProps = {
  label: string;
  help: string;
  value: number[];
  options: LinkedProductOption[];
  excludeId?: number;
  onChange: (ids: number[]) => void;
};

export default function LinkedProductsPicker({
  label,
  help,
  value,
  options,
  excludeId,
  onChange,
}: LinkedProductsPickerProps) {
  const [query, setQuery] = useState("");

  const optionMap = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const selected = value
    .map((id) => optionMap.get(id))
    .filter((option): option is LinkedProductOption => Boolean(option));

  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return options
      .filter((option) => option.id !== excludeId)
      .filter((option) => !value.includes(option.id))
      .filter((option) =>
        normalized ? option.name.toLowerCase().includes(normalized) : true,
      )
      .slice(0, 8);
  }, [excludeId, options, query, value]);

  function addProduct(productId: number) {
    if (value.includes(productId)) return;
    onChange([...value, productId]);
    setQuery("");
  }

  function removeProduct(productId: number) {
    onChange(value.filter((id) => id !== productId));
  }

  return (
    <div className={k.linkedGroup}>
      <div className={k.linkedHeader}>
        <strong>{label}</strong>
        <p>{help}</p>
      </div>

      {selected.length > 0 && (
        <ul className={k.linkedSelected}>
          {selected.map((product) => (
            <li key={product.id}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" />
              ) : (
                <span className={k.linkedThumbFallback} />
              )}
              <span>{product.name}</span>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                aria-label={`Remove ${product.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={k.linkedSearch}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products to add…"
        />
        {query && available.length > 0 && (
          <ul className={k.linkedResults}>
            {available.map((product) => (
              <li key={product.id}>
                <button type="button" onClick={() => addProduct(product.id)}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" />
                  ) : (
                    <span className={k.linkedThumbFallback} />
                  )}
                  <span>{product.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query && available.length === 0 && (
          <p className={k.linkedEmpty}>No matching products.</p>
        )}
      </div>
    </div>
  );
}
