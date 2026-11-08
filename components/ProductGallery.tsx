"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product, ProductImage } from "@/lib/products";

type ProductGalleryProps = {
  product: Product;
  images: ProductImage[];
};

export default function ProductGallery({ product, images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex] ?? images[0] ?? { id: "featured", imageUrl: product.image };

  function moveSlide(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div className="pdp-gallery">
      <div className="pdp-media" aria-live="polite">
        <Image
          key={currentImage.id}
          src={currentImage.imageUrl}
          alt={`${product.name}, camiseta oversized ${product.color.toLowerCase()}`}
          fill
          priority={activeIndex === 0}
          unoptimized
          sizes="(max-width: 900px) 100vw, 55vw"
          style={{ objectFit: "contain" }}
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            className="pdp-gallery-arrow pdp-gallery-previous"
            type="button"
            aria-label="Ver imagem anterior"
            onClick={() => moveSlide(-1)}
          >
            ‹
          </button>
          <button
            className="pdp-gallery-arrow pdp-gallery-next"
            type="button"
            aria-label="Ver próxima imagem"
            onClick={() => moveSlide(1)}
          >
            ›
          </button>
          <div className="pdp-gallery-pagination" role="group" aria-label="Escolher imagem do produto">
            {images.map((image, index) => (
              <button
                className={`pdp-gallery-dot${index === activeIndex ? " is-active" : ""}`}
                key={image.id}
                type="button"
                aria-label={`Imagem ${index + 1} de ${images.length}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <span className="pdp-gallery-count" aria-hidden="true">{activeIndex + 1} / {images.length}</span>
        </>
      )}
    </div>
  );
}
