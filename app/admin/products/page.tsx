import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import ProductsTable from "@/components/admin/ProductsTable";
import { requireAdminUser } from "@/lib/admin-auth.server";
import { requirePool } from "@/lib/db.server";
import type { Size } from "@/lib/products";

type ProductRow = {
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
};

type ProductsPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const user = await requireAdminUser();
  const [{ error, notice }, result] = await Promise.all([
    searchParams,
    requirePool().query<ProductRow>(
      `SELECT products.id, name, price::float8 AS price, color, image, active, sort_order, category, featured,
              COALESCE(
                (SELECT jsonb_object_agg(size, quantity)
                 FROM public.product_stock
                 WHERE product_id = products.id),
                '{"P":0,"M":0,"G":0,"GG":0,"EXG":0}'::jsonb
              ) AS stock
       FROM public.products ORDER BY sort_order, id`
    ),
  ]);

  return (
    <AdminShell user={user} activeSection="products">
      <div className="admin-page-heading">
        <div>
          <h1>Camisas</h1>
          <p className="admin-page-subtitle">
            {result.rows.length} {result.rows.length === 1 ? "camisa cadastrada" : "camisas cadastradas"}. As que estão ativas aparecem na loja.
          </p>
        </div>
        <Link className="admin-button" href="/admin/products/new">+ Nova camisa</Link>
      </div>
      {notice && <p className="admin-alert admin-alert-success">{notice}</p>}
      {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
      <ProductsTable products={result.rows} />
    </AdminShell>
  );
}
