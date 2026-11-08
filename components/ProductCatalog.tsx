"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SIZES, type Product, type ProductCategory, type Size } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";
import { money, waLink } from "@/lib/storefront";

type ProductCatalogProps = {
  products: Product[];
};

const categoryLabels: Record<ProductCategory, string> = {
  camisa: "Camisas",
  bone: "Bonés",
  moletom: "Moletons",
};

const colorSwatches: Record<string, string> = {
  branco: "#fff",
  preto: "#111",
  cinza: "#8e8e8e",
  azul: "#2f4da8",
  "verde militar": "#526247",
};

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const prices = products.map((product) => product.price);
  const minimumPrice = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maximumPrice = prices.length ? Math.ceil(Math.max(...prices)) : 1000;
  const colors = [...new Set(products.map((product) => product.color))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([minimumPrice, maximumPrice]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [sortOrder, setSortOrder] = useState("new");
  const [selectedProductSizes, setSelectedProductSizes] = useState<Record<number, Size | null>>({});
  const visibleProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.price >= priceRange[0] &&
        product.price <= priceRange[1] &&
        (selectedColors.length === 0 || selectedColors.includes(product.color)) &&
        (selectedCategories.length === 0 || selectedCategories.includes(product.category)) &&
        (selectedSizes.length === 0 ||
          selectedSizes.some((size) => product.stock[size] > 0))
    );
    if (sortOrder === "asc") return filtered.sort((a, b) => a.price - b.price || a.id - b.id);
    if (sortOrder === "desc") return filtered.sort((a, b) => b.price - a.price || a.id - b.id);
    if (sortOrder === "az") return filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return filtered;
  }, [priceRange, products, selectedCategories, selectedColors, selectedSizes, sortOrder]);

  function toggleColor(color: string) {
    setSelectedColors((current) =>
      current.includes(color) ? current.filter((item) => item !== color) : [...current, color]
    );
  }

  function toggleCategory(category: ProductCategory) {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  function toggleSize(size: Size) {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size]
    );
  }

  function resetFilters() {
    setPriceRange([minimumPrice, maximumPrice]);
    setSelectedColors([]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSortOrder("new");
  }

  function selectProductSize(productId: number, size: Size) {
    setSelectedProductSizes((current) => ({ ...current, [productId]: size }));
  }

  return (
    <section className="catalog-results" aria-label="Lista de produtos">
      <div className="catalog-toolbar" aria-label="Filtros de produtos">
        <p className="catalog-count" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "produto" : "produtos"}
        </p>
        <fieldset className="catalog-filter-group catalog-category-filter">
          <legend>Tipo</legend>
          {(Object.keys(categoryLabels) as ProductCategory[]).map((category) => (
            <label className="catalog-category-option" key={category}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              <span>{categoryLabels[category]}</span>
            </label>
          ))}
        </fieldset>
        {colors.length > 0 && (
          <fieldset className="catalog-filter-group catalog-color-filter">
            <legend>Cor</legend>
            {colors.map((color) => (
              <label className="catalog-color-option" key={color} title={color}>
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={() => toggleColor(color)}
                />
                <span
                  className="catalog-color-swatch"
                  style={{ backgroundColor: colorSwatches[color.toLocaleLowerCase("pt-BR")] ?? "#777" }}
                />
                <span className="catalog-color-name">{color}</span>
              </label>
            ))}
          </fieldset>
        )}
        <fieldset className="catalog-filter-group catalog-size-filter">
          <legend>Tamanho</legend>
          {SIZES.map((size) => (
            <label className="catalog-size-option" key={size}>
              <input
                type="checkbox"
                checked={selectedSizes.includes(size)}
                onChange={() => toggleSize(size)}
              />
              <span>{size}</span>
            </label>
          ))}
        </fieldset>
        <div className="catalog-price-filter">
          <span>Preço</span>
          <div className="catalog-price-inputs">
            <label>
              <span>De</span>
              <input
                type="number"
                min={minimumPrice}
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPriceRange(([, high]) => [Math.min(Math.max(value, minimumPrice), high), high]);
                }}
              />
            </label>
            <label>
              <span>Até</span>
              <input
                id="catalog-price-max"
                type="number"
                min={priceRange[0]}
                max={maximumPrice}
                value={priceRange[1]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setPriceRange(([low]) => [low, Math.min(Math.max(value, low), maximumPrice)]);
                }}
              />
            </label>
          </div>
        </div>
        <label className="catalog-sort">
          <span>Ordenar</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="new">Mais recentes</option>
            <option value="asc">Menor preço</option>
            <option value="desc">Maior preço</option>
            <option value="az">Nome</option>
          </select>
        </label>
        <button className="catalog-clear" type="button" onClick={resetFilters}>
          Limpar
        </button>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="catalog-no-results">
          <h2>Nenhum produto com esses filtros.</h2>
          <p>Tente outro tamanho, outra cor ou um preço maior.</p>
          <button className="button secondary" type="button" onClick={resetFilters}>Limpar filtros</button>
        </div>
      ) : (
        <div className="grid">
          {visibleProducts.map((product) => (
              <article className="product" key={product.id}>
                <div className="catalog-product-media">
                  <Link
                    className="product-media"
                    href={`/produto/${product.id}`}
                    aria-label={`Ver detalhes de ${product.name}`}
                  >
                    <img
                      src={product.image}
                      alt={`${product.name}, ${categoryLabels[product.category].toLowerCase()} ${product.color.toLowerCase()}`}
                      loading="lazy"
                    />
                    <span className="product-view" aria-hidden="true">Ver peça ↗</span>
                  </Link>
                  <div className="catalog-quick-buy">
                    <p>Escolha o tamanho</p>
                    <div className="catalog-product-sizes" role="group" aria-label={`Tamanho para ${product.name}`}>
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          disabled={product.stock[size] === 0}
                          title={product.stock[size] === 0 ? `Tamanho ${size} esgotado` : undefined}
                          aria-label={
                            product.stock[size] === 0
                              ? `Tamanho ${size}, esgotado`
                              : `Tamanho ${size}`
                          }
                          aria-pressed={selectedProductSizes[product.id] === size}
                          onClick={() => selectProductSize(product.id, size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {SIZES.every((size) => product.stock[size] === 0) && (
                      <p className="catalog-out-of-stock">Todos os tamanhos esgotados</p>
                    )}
                    <a
                      className="button catalog-buy-button"
                      href={
                        selectedProductSizes[product.id]
                          ? waLink(
                              `Olá! Tenho interesse na ${product.name}, tamanho ${selectedProductSizes[product.id]}. Poderia me ajudar?\n${absoluteUrl(`/produto/${product.id}`)}`
                            )
                          : undefined
                      }
                      target={selectedProductSizes[product.id] ? "_blank" : undefined}
                      rel={selectedProductSizes[product.id] ? "noopener noreferrer" : undefined}
                      aria-disabled={!selectedProductSizes[product.id]}
                      onClick={(event) => {
                        if (!selectedProductSizes[product.id]) event.preventDefault();
                      }}
                    >
                      Comprar pelo WhatsApp
                    </a>
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="price">{money.format(product.price)}</p>
                  <p className="meta">{categoryLabels[product.category]} · {product.color}</p>
                  <Link className="catalog-details-link" href={`/produto/${product.id}`}>
                    Ver detalhes <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
          ))}
        </div>
      )}
    </section>
  );
}
