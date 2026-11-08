import Storefront from "@/components/Storefront";
import { getProducts } from "@/lib/products.server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return <Storefront products={products} />;
}
