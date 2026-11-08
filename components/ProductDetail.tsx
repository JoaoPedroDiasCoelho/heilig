"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SIZES, type Product, type ProductImage, type Size } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";
import { money, waLink } from "@/lib/storefront";
import ProductGallery from "@/components/ProductGallery";
import SizeGuideSection from "@/components/sections/SizeGuideSection";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import HeroSection from "./sections/HeroSection";
import SiteHeader from "./sections/SiteHeader";
import SiteFooter from "./sections/SiteFooter";

type ProductDetailProps = {
  product: Product;
  images: ProductImage[];
};

export default function ProductDetail({ product, images }: ProductDetailProps) {
  const [size, setSize] = useState<Size | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    if (!sizeGuideOpen) return;
    document.body.classList.add("panel-open");
    return () => document.body.classList.remove("panel-open");
  }, [sizeGuideOpen]);

  function buy() {
    if (!size || product.stock[size] < 1) return;
    window.open(
      waLink(
        `Olá! Tenho interesse na ${product.name}, tamanho ${size}. Poderia me ajudar?\n${absoluteUrl(`/produto/${product.id}`)}`
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <><SiteHeader onOpenSizeGuide={() => setSizeGuideOpen(true)} /><main className="product-detail-page">
      <section className="pdp product-page" aria-labelledby="product-title">
        <ProductGallery product={product} images={images} />

        <div className="pdp-info">
          <p className="eyebrow">Oversized · {product.color}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="pdp-price">{money.format(product.price)}</p>
          <p className="pdp-desc">Camiseta oversized na cor {product.color.toLowerCase()}.</p>

          <div className="pdp-size-block">
            <p className="pdp-label" id="product-size-label">Selecione o tamanho</p>
            <div className="pdp-sizes" role="group" aria-labelledby="product-size-label">
              {SIZES.map((item) => (
                <button
                  className="size-pill"
                  key={item}
                  type="button"
                  disabled={product.stock[item] === 0}
                  title={product.stock[item] === 0 ? "Tamanho esgotado" : undefined}
                  aria-label={
                    product.stock[item] === 0
                      ? `Tamanho ${item}, esgotado`
                      : `Tamanho ${item}`
                  }
                  aria-pressed={size === item}
                  onClick={() => setSize(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button className="size-guide-trigger" type="button" onClick={() => setSizeGuideOpen(true)}>
            Guia de medidas
          </button>

          <p className="pdp-hint" aria-live="polite">
            {size
              ? `Tamanho selecionado: ${size} · ${product.stock[size]} disponíveis`
              : SIZES.every((item) => product.stock[item] === 0)
                ? "Todos os tamanhos estão esgotados."
                : "Selecione um tamanho disponível para continuar."}
          </p>

          <button
            className="button pdp-cta"
            type="button"
            disabled={!size || product.stock[size] < 1}
            onClick={buy}
          >
            <WhatsAppIcon />
            Comprar pelo WhatsApp
          </button>

          <p className="pdp-features">
            Algodão pesado · 260 g/m² · Construção ampla · Toque firme · Proporções pensadas
          </p>
        </div>
      </section>

      
    </main>
    <SiteFooter />
    {sizeGuideOpen && <SizeGuideSection onClose={() => setSizeGuideOpen(false)} />}
    </>

  );
}
