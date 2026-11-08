import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ProductImagesManager from "@/components/admin/ProductImagesManager";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdminUser } from "@/lib/admin-auth.server";
import { requirePool } from "@/lib/db.server";
import type { Size } from "@/lib/products";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const user = await requireAdminUser();
  const [{ id }, { error, notice }] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isSafeInteger(productId) || productId < 1) notFound();

  const result = await requirePool().query<{
    id: number;
    name: string;
    price: number;
    color: string;
    image: string;
    active: boolean;
    sort_order: number;
    category: "camisa" | "bone" | "moletom";
    featured: boolean;
    stock: Record<Size, number>;
  }>(
    `SELECT products.id, name, price::float8 AS price, color, image, active, sort_order, category, featured,
            COALESCE(
              (SELECT jsonb_object_agg(size, quantity)
               FROM public.product_stock
               WHERE product_id = products.id),
              '{"P":0,"M":0,"G":0,"GG":0,"EXG":0}'::jsonb
            ) AS stock
     FROM public.products WHERE id = $1 LIMIT 1`,
    [productId]
  );
  const product = result.rows[0];
  if (!product) notFound();
  const gallery = await requirePool().query<{
    id: number;
    image_url: string;
    public_id: string | null;
    is_featured: boolean;
  }>(
    `SELECT id, image_url, public_id, is_featured
     FROM public.product_images WHERE product_id = $1
     ORDER BY is_featured DESC, sort_order, id`,
    [productId]
  );

  return (
    <AdminShell user={user} activeSection="products">
      <div className="admin-page-heading">
        <div>
          <Link className="admin-back-link" href="/admin/products">← Camisas</Link>
          <h1>Editar camisa</h1>
        </div>
      </div>
      {notice && <p className="admin-alert admin-alert-success">{notice}</p>}
      <ProductForm product={product} error={error} />
      <ProductImagesManager productId={productId} images={gallery.rows} />
    </AdminShell>
  );
}
