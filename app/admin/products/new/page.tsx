import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdminUser } from "@/lib/admin-auth.server";

type NewProductPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const user = await requireAdminUser();
  const { error } = await searchParams;

  return (
    <AdminShell user={user} activeSection="products">
      <div className="admin-page-heading">
        <div>
          <Link className="admin-back-link" href="/admin/products">← Camisas</Link>
          <h1>Nova camisa</h1>
        </div>
      </div>
      <ProductForm error={error} />
    </AdminShell>
  );
}
