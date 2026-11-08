"use client";

import { useEffect, useState } from "react";
import { type Product } from "@/lib/products";
import CollectionSection from "@/components/sections/CollectionSection";
import ReelSection from "@/components/sections/ReelSection";
import SiteFooter from "@/components/sections/SiteFooter";
import SiteHeader from "@/components/sections/SiteHeader";
import SizeGuideSection from "@/components/sections/SizeGuideSection";

type StorefrontProps = {
  products: Product[];
};

export default function Storefront({ products }: StorefrontProps) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    if (!sizeGuideOpen) return;

    document.body.classList.add("panel-open");
    return () => {
      document.body.classList.remove("panel-open");
    };
  }, [sizeGuideOpen]);

  return (
    <>
      <SiteHeader onOpenSizeGuide={() => setSizeGuideOpen(true)} />

      <main>
        <ReelSection onOpenSizeGuide={() => setSizeGuideOpen(true)} />
        <CollectionSection products={products} />
      </main>

      <SiteFooter />

      {sizeGuideOpen && <SizeGuideSection onClose={() => setSizeGuideOpen(false)} />}
    </>
  );
}
