import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getProductById, getProductImages } from "@/lib/products.server";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Produto não encontrado | HEILIG®",
      description: "Este produto não está disponível no catálogo da HEILIG®.",
      openGraph: {
        title: "Produto não encontrado | HEILIG®",
        description: "Este produto não está disponível no catálogo da HEILIG®.",
        type: "website",
      },
    };
  }

  const description = `Conheça ${product.name}, camiseta oversized HEILIG® na cor ${product.color}.`;

  return {
    title: `${product.name} | HEILIG®`,
    description,
    alternates: {
      canonical: `/produto/${product.id}`,
    },
    openGraph: {
      title: `${product.name} | HEILIG®`,
      description,
      url: absoluteUrl(`/produto/${product.id}`),
      siteName: "HEILIG®",
      locale: "pt_BR",
      type: "website",
      images: [{ url: absoluteUrl(product.image), alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();
  const images = await getProductImages(product.id, product.image);

  const description = `Conheça ${product.name}, camiseta oversized HEILIG® na cor ${product.color}.`;
  const productUrl = absoluteUrl(`/produto/${product.id}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: absoluteUrl(product.image),
    sku: String(product.id),
    brand: {
      "@type": "Brand",
      name: "HEILIG®",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: Object.values(product.stock).some((quantity) => quantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <ProductDetail product={product} images={images} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
