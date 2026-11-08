"use client";

import { useEffect, useState, type ReactNode } from "react";
import SiteHeader from "@/components/sections/SiteHeader";
import SizeGuideSection from "@/components/sections/SizeGuideSection";

type ProductsPageShellProps = {
  children: ReactNode;
};

export default function ProductsPageShell({ children }: ProductsPageShellProps) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    if (!sizeGuideOpen) return;
    document.body.classList.add("panel-open");
    return () => document.body.classList.remove("panel-open");
  }, [sizeGuideOpen]);

  return (
    <>
      <SiteHeader onOpenSizeGuide={() => setSizeGuideOpen(true)} />
      {children}
      {sizeGuideOpen && <SizeGuideSection onClose={() => setSizeGuideOpen(false)} />}
    </>
  );
}
