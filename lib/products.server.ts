import "server-only";

import { cache } from "react";
import { PRODUCTS, type Product, type ProductCategory, type ProductImage } from "@/lib/products";
import { getPool } from "@/lib/db.server";

type ProductRow = {
  id: number | string;
  name: string;
  price: number | string;
  color: string;
  image: string;
  category: ProductCategory;
  featured: boolean;
};

function toProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price),
    color: row.color,
    image: row.image,
    category: row.category,
    featured: row.featured,
  };
}

const SELECT_PRODUCTS = `
  SELECT id, name, price::float8 AS price, color, image, category, featured
  FROM public.products
  WHERE active = TRUE
`;
const SELECT_FEATURED_PRODUCTS = `${SELECT_PRODUCTS} AND featured = TRUE AND image <> ''`;
const SELECT_ORDERED_PRODUCTS = `${SELECT_FEATURED_PRODUCTS} ORDER BY sort_order ASC, id ASC`;

export const getProducts = cache(async (): Promise<Product[]> => {
  const pool = getPool();
  if (!pool) return PRODUCTS;

  try {
    const result = await pool.query(SELECT_ORDERED_PRODUCTS);
    const rows = result.rows as ProductRow[];
    return rows.map(toProduct);
  } catch {
    console.error("[catalog] PostgreSQL query failed; using the bundled catalog fallback.");
    return PRODUCTS;
  }
});

export const getCatalogProducts = cache(async (): Promise<Product[]> => {
  const pool = getPool();
  if (!pool) return PRODUCTS;

  try {
    const result = await pool.query<ProductRow>(
      `${SELECT_PRODUCTS} AND image <> '' ORDER BY sort_order ASC, id ASC`
    );
    return result.rows.map(toProduct);
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string" &&
      /^[A-Za-z0-9_]{1,16}$/.test(error.code)
        ? error.code
        : "unknown";
    const hint =
      code === "42703"
        ? "Check that db/product-catalog.sql was applied to the deployed database."
        : code === "42P01"
          ? "Check that db/schema.sql was applied to the deployed database."
          : undefined;
    console.error("[catalog] Product listing query failed; showing an empty catalog.", {
      code,
      hint,
    });
    return [];
  }
});

export const getAllActiveProducts = cache(async (): Promise<Product[]> => {
  const pool = getPool();
  if (!pool) return PRODUCTS;

  try {
    const result = await pool.query<ProductRow>(
      `${SELECT_PRODUCTS} AND image <> '' ORDER BY sort_order ASC, id ASC`
    );
    return result.rows.map(toProduct);
  } catch {
    console.error("[catalog] Sitemap product query failed; using the bundled catalog fallback.");
    return PRODUCTS;
  }
});

export async function getProductById(id: string): Promise<Product | undefined> {
  const productId = Number(id);
  if (!Number.isSafeInteger(productId) || productId < 1) return undefined;

  const pool = getPool();
  if (!pool) return PRODUCTS.find((product) => product.id === productId);

  try {
    const result = await pool.query(`${SELECT_PRODUCTS} AND id = $1 LIMIT 1`, [productId]);
    const row = (result.rows as ProductRow[])[0];
    return row ? toProduct(row) : undefined;
  } catch {
    console.error("[catalog] PostgreSQL product lookup failed; using the bundled catalog fallback.");
    return PRODUCTS.find((product) => product.id === productId);
  }
}

export async function getProductImages(productId: number, featuredImage: string): Promise<ProductImage[]> {
  const pool = getPool();
  if (!pool) return [{ id: "featured", imageUrl: featuredImage }];

  try {
    const result = await pool.query<{ id: number | string; image_url: string }>(
      `SELECT id, image_url
       FROM public.product_images
       WHERE product_id = $1
       ORDER BY is_featured DESC, sort_order ASC, id ASC`,
      [productId]
    );
    return result.rows.length > 0
      ? result.rows.map((row) => ({ id: row.id, imageUrl: row.image_url }))
      : [{ id: "featured", imageUrl: featuredImage }];
  } catch {
    console.error("[catalog] Product image gallery lookup failed; showing the featured image only.");
    return [{ id: "featured", imageUrl: featuredImage }];
  }
}
