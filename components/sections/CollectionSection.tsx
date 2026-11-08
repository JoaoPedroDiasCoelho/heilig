import type { Product } from "@/lib/products";
import { money } from "@/lib/storefront";
import Link from "next/link";

type CollectionSectionProps = {
  products: Product[];
};

export default function CollectionSection({ products }: CollectionSectionProps) {
  return (
    <section className="section" id="colecao">
      <div className="section-head">
        <h2>Destaques<br />da loja</h2>
        <p>
          Peças selecionadas para a página inicial. Explore a coleção completa
          de camisas, bonés e moletons.
        </p>
      </div>

      <div className="grid">
        {products.map((product) => (
          <article className="product" key={product.id}>
            <Link
              className="product-media"
              href={`/produto/${product.id}`}
              aria-label={`Ver detalhes de ${product.name}`}
            >
              <img
                src={product.image}
                alt={`${product.name}, camiseta oversized ${product.color.toLowerCase()}`}
                loading="lazy"
              />
              <span className="product-view" aria-hidden="true">VIEW ↗</span>
            </Link>

            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="price">{money.format(product.price)}</p>
              <p className="meta">
                {product.category === "bone" ? "Boné" : product.category === "moletom" ? "Moletom" : "Camisa"}
                {" · "}{product.color}
              </p>
              <Link
                className="button secondary details-btn"
                href={`/produto/${product.id}`}
              >
                Ver detalhes
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="collection-all-products">
        <Link className="button secondary" href="/produtos">Ver todos os produtos</Link>
      </div>
    </section>
  );
}
