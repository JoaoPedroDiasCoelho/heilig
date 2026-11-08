import type { Metadata } from "next";
import ProductCatalog from "@/components/ProductCatalog";
import ProductsPageShell from "@/components/ProductsPageShell";
import SiteFooter from "@/components/sections/SiteFooter";
import { getCatalogProducts } from "@/lib/products.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos | HEILIG®",
  description: "Explore camisas, bonés e moletons HEILIG® e filtre por preço e cor.",
};

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <div className="products-storefront">
      <ProductsPageShell>
        <main className="products-page">
          <header className="products-page-heading">
            <p className="eyebrow">HEILIG® · CATÁLOGO</p>
            <h1>Produtos</h1>
            <p>Explore a coleção completa e encontre sua próxima peça.</p>
          </header>
          <ProductCatalog products={products} />
        </main>
      </ProductsPageShell>
      <SiteFooter />
    </div>
  );
}
