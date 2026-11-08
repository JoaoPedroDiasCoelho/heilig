"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  deleteProductAction,
  toggleFeaturedProductAction,
  toggleProductAction,
} from "@/app/admin/actions";
import type { ProductCategory } from "@/lib/products";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

type ProductListItem = {
  id: number;
  name: string;
  price: number;
  color: string;
  image: string;
  active: boolean;
  sort_order: number;
  category: ProductCategory;
  featured: boolean;
};

type ProductFilter = "all" | "active" | "inactive";

type ProductsTableProps = {
  products: ProductListItem[];
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function colorValue(color: string) {
  const normalized = color.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  if (normalized.includes("branco") || normalized.includes("off-white") || normalized.includes("creme")) return "#e9e5d9";
  if (normalized.includes("preto")) return "#161616";
  if (normalized.includes("cinza")) return "#8d8d8d";
  if (normalized.includes("verde")) return "#60734e";
  if (normalized.includes("azul")) return "#4f698c";
  if (normalized.includes("vermelho")) return "#b22b25";
  if (normalized.includes("bege") || normalized.includes("areia") || normalized.includes("marrom")) return "#a78e6e";
  return "#e10600";
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [search, setSearch] = useState("");
  const activeCount = products.filter((product) => product.active).length;
  const inactiveCount = products.length - activeCount;
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? product.active : !product.active);
      const matchesSearch =
        !query ||
        product.name.toLocaleLowerCase("pt-BR").includes(query) ||
        product.color.toLocaleLowerCase("pt-BR").includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, products, search]);

  return (
    <>
      <div className="admin-catalog-toolbar">
        <label className="admin-search">
          <span className="admin-search-icon" aria-hidden="true">⌕</span>
          <span className="admin-visually-hidden">Buscar camisa por nome ou cor</span>
          <input
            type="search"
            placeholder="Buscar por nome ou cor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="admin-filter-tabs" role="group" aria-label="Filtrar camisas">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            Todas <span>{products.length}</span>
          </button>
          <button type="button" aria-pressed={filter === "active"} onClick={() => setFilter("active")}>
            Ativas <span>{activeCount}</span>
          </button>
          <button type="button" aria-pressed={filter === "inactive"} onClick={() => setFilter("inactive")}>
            Inativas <span>{inactiveCount}</span>
          </button>
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="admin-empty-state">
          <h2>{products.length === 0 ? "Nenhuma camisa cadastrada" : "Nenhuma camisa encontrada"}</h2>
          <p>
            {products.length === 0
              ? "Cadastre o primeiro produto para publicar no catálogo."
              : "Tente outro termo de busca ou filtro."}
          </p>
          {products.length === 0 && (
            <Link className="admin-button" href="/admin/products/new">Cadastrar camisa</Link>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap admin-catalog-table-wrap">
          <table className="admin-table admin-catalog-table">
            <thead>
              <tr>
                <th>Camisa</th>
                <th>Tipo</th>
                <th>Cor</th>
                <th>Preço</th>
                <th>Ativo</th>
                <th>Destaque</th>
                <th><span className="admin-visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      {product.image ? (
                        <Image src={product.image} alt="" width={52} height={64} unoptimized />
                      ) : (
                        <span className="admin-product-no-image" aria-label="Sem imagem">+</span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small>Produto #{product.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category === "bone" ? "Boné" : product.category === "moletom" ? "Moletom" : "Camisa"}</td>
                  <td>
                    <span className="admin-product-color">
                      <i aria-hidden="true" style={{ backgroundColor: colorValue(product.color) }} />
                      {product.color}
                    </span>
                  </td>
                  <td>{currency.format(product.price)}</td>
                  <td>
                    <form action={toggleProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      {!product.active && <input type="hidden" name="active" value="on" />}
                      <button
                        className={`admin-switch${product.active ? " is-active" : ""}`}
                        type="submit"
                        role="switch"
                        aria-checked={product.active}
                        aria-label={`${product.active ? "Ocultar" : "Exibir"} ${product.name} na loja`}
                        title={product.active ? "Clique para ocultar na loja" : "Clique para exibir na loja"}
                      >
                        <span />
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={toggleFeaturedProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      {!product.featured && <input type="hidden" name="featured" value="on" />}
                      <button
                        className={`admin-switch${product.featured ? " is-active" : ""}`}
                        type="submit"
                        disabled={(!product.active || !product.image) && !product.featured}
                        role="switch"
                        aria-checked={product.featured}
                        aria-label={`${product.featured ? "Remover destaque de" : "Destacar"} ${product.name}`}
                        title={
                          !product.active
                            ? "Ative o produto para destacá-lo na home"
                            : !product.image
                              ? "Adicione uma imagem para destacar o produto"
                              : product.featured
                                ? "Remover destaque da home"
                                : "Destacar na home"
                        }
                      >
                        <span />
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="admin-edit-button" href={`/admin/products/${product.id}/edit`}>Editar</Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmSubmitButton
                          className="admin-danger-icon"
                          question={`Remover "${product.name}" permanentemente?`}
                          ariaLabel={`Remover ${product.name}`}
                        >
                          ×
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
