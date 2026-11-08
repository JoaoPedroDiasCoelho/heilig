"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { destroyCloudinaryAsset, getCloudinarySignature, isValidCloudinaryAsset } from "@/lib/cloudinary.server";
import { requirePool } from "@/lib/db.server";
import type { ProductCategory } from "@/lib/products";
import {
  createAdminSession,
  destroyAdminSession,
  hashPassword,
  requireAdminRole,
  requireAdminUser,
  verifyPassword,
} from "@/lib/admin-auth.server";

type ProductInput = {
  name: string;
  price: string;
  color: string;
  image: string;
  category: ProductCategory;
  sortOrder: number;
  active: boolean;
  featured: boolean;
};

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function rawValue(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function withError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parseProduct(formData: FormData, requireImage = true): ProductInput | null {
  const name = value(formData, "name");
  const price = value(formData, "price");
  const color = value(formData, "color");
  const image = value(formData, "image");
  const category = value(formData, "category");
  const sortOrderValue = value(formData, "sort_order");
  const sortOrder = Number(sortOrderValue || "0");

  if (!name || name.length > 120) return null;
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(price)) return null;
  if (!color || color.length > 80) return null;
  if (category !== "camisa" && category !== "bone" && category !== "moletom") return null;
  if (requireImage && !image) return null;
  if (image && (image.length > 2048 || image.includes("\\"))) return null;
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 1_000_000) return null;

  if (image) {
    if (image.startsWith("/")) {
      if (image.startsWith("//") || image.split("/").includes("..")) return null;
    } else {
      try {
        const url = new URL(image);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      } catch {
        return null;
      }
    }
  }

  return {
    name,
    price,
    color,
    image,
    category,
    sortOrder,
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  };
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function loginAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  if (!validEmail(email) || !password || password.length > 128) {
    withError("/admin/login", "E-mail ou senha inválidos.");
  }

  const pool = requirePool();
  const attempt = await pool.query<{ locked: boolean }>(
    `SELECT locked_until > now() AS locked
     FROM public.admin_login_attempts WHERE email = $1`,
    [email]
  );
  if (attempt.rows[0]?.locked) {
    withError("/admin/login", "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
  }

  const result = await pool.query<{
    id: number;
    password_hash: string;
  }>(
    `SELECT id, password_hash
     FROM public.admin_users
     WHERE email = $1 AND active = true
     LIMIT 1`,
    [email]
  );
  const user = result.rows[0];
  const passwordValid = await verifyPassword(password, user?.password_hash ?? "");
  if (!user || !passwordValid) {
    await pool.query(
      `INSERT INTO public.admin_login_attempts (email, failed_attempts, locked_until)
       VALUES ($1, 1, NULL)
       ON CONFLICT (email) DO UPDATE SET
         failed_attempts = CASE
           WHEN public.admin_login_attempts.locked_until IS NOT NULL
             AND public.admin_login_attempts.locked_until <= now() THEN 1
           ELSE public.admin_login_attempts.failed_attempts + 1
         END,
         locked_until = CASE
           WHEN public.admin_login_attempts.locked_until IS NOT NULL
             AND public.admin_login_attempts.locked_until <= now() THEN NULL
           WHEN public.admin_login_attempts.failed_attempts + 1 >= 5 THEN now() + interval '15 minutes'
           ELSE public.admin_login_attempts.locked_until
         END,
         updated_at = now()`,
      [email]
    );
    withError("/admin/login", "E-mail ou senha inválidos.");
  }

  await pool.query("DELETE FROM public.admin_login_attempts WHERE email = $1", [email]);
  await pool.query("DELETE FROM public.admin_sessions WHERE expires_at <= now()");
  await createAdminSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createProductAction(formData: FormData) {
  await requireAdminUser();
  const product = parseProduct(formData, false);
  if (!product) return { success: false as const, message: "Revise os campos do produto." };

  const client = await requirePool().connect();
  let createdId: number;
  try {
    await client.query("BEGIN");
    const created = await client.query<{ id: number }>(
      `INSERT INTO public.products (name, price, color, image, category, sort_order, active, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        product.name,
        product.price,
        product.color,
        product.image,
        product.category,
        product.sortOrder,
        product.active,
        product.featured,
      ]
    );
    const id = created.rows[0]?.id;
    if (!id) throw new Error("Could not create the product.");
    if (product.image) {
      await client.query(
        `INSERT INTO public.product_images (product_id, image_url, is_featured, sort_order)
         VALUES ($1, $2, true, 0)`,
        [id, product.image]
      );
    }
    await client.query("COMMIT");
    createdId = id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/sitemap.xml");
  return { success: true as const, productId: createdId };
}

export async function updateProductAction(formData: FormData) {
  await requireAdminUser();
  const id = Number(value(formData, "id"));
  const product = parseProduct(formData, false);
  if (!Number.isSafeInteger(id) || id < 1 || !product) {
    withError(`/admin/products/${value(formData, "id")}/edit`, "Revise os campos do produto.");
  }

  const result = await requirePool().query(
    `UPDATE public.products
     SET name = $1, price = $2, color = $3, category = $4, sort_order = $5,
         active = $6, featured = $7, updated_at = now()
     WHERE id = $8`,
    [
      product.name,
      product.price,
      product.color,
      product.category,
      product.sortOrder,
      product.active,
      product.featured,
      id,
    ]
  );
  if (result.rowCount === 0) redirect("/admin/products?error=Camisa+nao+encontrada.");

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${id}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=Camisa+atualizada.");
}

export async function toggleProductAction(formData: FormData) {
  await requireAdminUser();
  const id = Number(value(formData, "id"));
  const active = formData.get("active") === "on";
  if (!Number.isSafeInteger(id) || id < 1) {
    redirect("/admin/products?error=Camisa+inv%C3%A1lida.");
  }

  const result = await requirePool().query(
    "UPDATE public.products SET active = $1, updated_at = now() WHERE id = $2 AND ($1 = false OR image <> '')",
    [active, id]
  );
  if (result.rowCount === 0) {
    const exists = await requirePool().query("SELECT 1 FROM public.products WHERE id = $1", [id]);
    if (exists.rowCount === 0) redirect("/admin/products?error=Camisa+nao+encontrada.");
    redirect(`/admin/products/${id}/edit?error=Adicione+uma+imagem+de+destaque+antes+de+exibir+a+camisa.`);
  }

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${id}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=Status+da+camisa+atualizado.");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminUser();
  const id = Number(value(formData, "id"));
  if (!Number.isSafeInteger(id) || id < 1) redirect("/admin/products?error=Camisa+inv%C3%A1lida.");

  const images = await requirePool().query<{ public_id: string | null }>(
    "SELECT public_id FROM public.product_images WHERE product_id = $1 AND public_id IS NOT NULL",
    [id]
  );
  for (const image of images.rows) {
    await destroyCloudinaryAsset(image.public_id!);
  }
  const result = await requirePool().query("DELETE FROM public.products WHERE id = $1", [id]);
  if (result.rowCount === 0) redirect("/admin/products?error=Camisa+nao+encontrada.");

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${id}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=Camisa+removida.");
}

export async function toggleFeaturedProductAction(formData: FormData) {
  await requireAdminUser();
  const id = Number(value(formData, "id"));
  const featured = formData.get("featured") === "on";
  if (!Number.isSafeInteger(id) || id < 1) {
    redirect("/admin/products?error=Camisa+inv%C3%A1lida.");
  }

  const result = await requirePool().query(
    `UPDATE public.products SET featured = $1, updated_at = now()
     WHERE id = $2 AND ($1 = false OR (active = true AND image <> ''))`,
    [featured, id]
  );
  if (result.rowCount === 0) {
    const exists = await requirePool().query<{ active: boolean; image: string }>(
      "SELECT active, image FROM public.products WHERE id = $1",
      [id]
    );
    if (!exists.rows[0]) redirect("/admin/products?error=Camisa+nao+encontrada.");
    withError(
      `/admin/products/${id}/edit`,
      exists.rows[0].active
        ? "Adicione uma imagem antes de destacar a camisa."
        : "Ative a camisa antes de colocá-la em destaque."
    );
  }

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=Destaque+da+camisa+atualizado.");
}

type UploadedImage = {
  publicId: string;
  imageUrl: string;
};

type ImageActionResult = {
  success: boolean;
  message: string;
};

function validateProductId(productId: number) {
  return Number.isSafeInteger(productId) && productId > 0;
}

export async function createImageUploadSignatureAction(productId: number) {
  await requireAdminUser();
  if (!validateProductId(productId)) {
    return { success: false as const, message: "Produto inválido." };
  }

  const publicId = `heilig/products/${productId}/${randomUUID()}`;
  try {
    const exists = await requirePool().query("SELECT 1 FROM public.products WHERE id = $1", [productId]);
    if (exists.rowCount === 0) {
      return { success: false as const, message: "Produto não encontrado." };
    }
    return { success: true as const, ...getCloudinarySignature(publicId) };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Configure CLOUDINARY_")) {
      return { success: false as const, message: error.message };
    }
    throw error;
  }
}

export async function saveProductImagesAction(
  productId: number,
  images: unknown
): Promise<ImageActionResult> {
  await requireAdminUser();
  if (!validateProductId(productId) || !Array.isArray(images) || images.length < 1 || images.length > 10) {
    return { success: false, message: "Selecione de 1 a 10 imagens válidas." };
  }

  const uniqueIds = new Set<string>();
  for (const candidate of images) {
    if (typeof candidate !== "object" || candidate === null) {
      return { success: false, message: "O Cloudinary retornou imagens inválidas." };
    }
    const image = candidate as Partial<UploadedImage>;
    if (
      typeof image.publicId !== "string" ||
      image.publicId.length > 120 ||
      typeof image.imageUrl !== "string" ||
      image.imageUrl.length > 2048 ||
      uniqueIds.has(image.publicId)
    ) {
      return { success: false, message: "O Cloudinary retornou imagens inválidas ou repetidas." };
    }
    uniqueIds.add(image.publicId);
    try {
      if (!isValidCloudinaryAsset(productId, image.imageUrl, image.publicId)) {
        return { success: false, message: "Uma das imagens não pertence a este produto no Cloudinary." };
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Configure CLOUDINARY_")) {
        return { success: false, message: error.message };
      }
      throw error;
    }
  }

  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const product = await client.query("SELECT id FROM public.products WHERE id = $1 FOR UPDATE", [productId]);
    if (product.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Produto não encontrado." };
    }

    const current = await client.query<{ count: string; next_order: number }>(
      `SELECT count(*)::text AS count, COALESCE(max(sort_order), -1) + 1 AS next_order
       FROM public.product_images WHERE product_id = $1`,
      [productId]
    );
    const existingCount = Number(current.rows[0]?.count ?? 0);
    if (existingCount + images.length > 10) {
      await client.query("ROLLBACK");
      return { success: false, message: "Cada camisa pode ter no máximo 10 imagens." };
    }

    let sortOrder = Number(current.rows[0]?.next_order ?? 0);
    for (const image of images) {
      const isFirstImage = existingCount === 0 && sortOrder === 0;
      const inserted = await client.query(
        `INSERT INTO public.product_images (product_id, image_url, public_id, sort_order, is_featured)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (public_id) WHERE public_id IS NOT NULL DO NOTHING`,
        [productId, image.imageUrl, image.publicId, sortOrder, isFirstImage]
      );
      if (inserted.rowCount === 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "Uma das imagens já foi adicionada." };
      }
      if (isFirstImage) {
        await client.query(
          "UPDATE public.products SET image = $1, updated_at = now() WHERE id = $2",
          [image.imageUrl, productId]
        );
      }
      sortOrder += 1;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/produto/${productId}`);
  return { success: true, message: "Imagens adicionadas à galeria." };
}

export async function cleanupUnlinkedProductImagesAction(
  productId: number,
  publicIds: unknown
): Promise<ImageActionResult> {
  await requireAdminUser();
  if (!validateProductId(productId) || !Array.isArray(publicIds) || publicIds.length > 10) {
    return { success: false, message: "Não foi possível validar as imagens temporárias." };
  }

  const imageIds = publicIds.filter(
    (publicId): publicId is string =>
      typeof publicId === "string" &&
      new RegExp(`^heilig/products/${productId}/[a-f0-9-]{36}$`).test(publicId)
  );
  if (imageIds.length !== publicIds.length) {
    return { success: false, message: "Não foi possível validar as imagens temporárias." };
  }

  const linked = await requirePool().query<{ public_id: string }>(
    "SELECT public_id FROM public.product_images WHERE public_id = ANY($1::text[])",
    [imageIds]
  );
  const linkedIds = new Set(linked.rows.map((row) => row.public_id));
  for (const publicId of imageIds) {
    if (!linkedIds.has(publicId)) await destroyCloudinaryAsset(publicId);
  }
  return { success: true, message: "Uploads temporários removidos." };
}

export async function setFeaturedProductImageAction(
  productId: number,
  imageId: number
): Promise<ImageActionResult> {
  await requireAdminUser();
  if (!validateProductId(productId) || !validateProductId(imageId)) {
    return { success: false, message: "Imagem inválida." };
  }

  const client = await requirePool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM public.products WHERE id = $1 FOR UPDATE", [productId]);
    const image = await client.query<{ image_url: string }>(
      "SELECT image_url FROM public.product_images WHERE id = $1 AND product_id = $2",
      [imageId, productId]
    );
    if (!image.rows[0]) {
      await client.query("ROLLBACK");
      return { success: false, message: "Imagem não encontrada." };
    }
    await client.query("UPDATE public.product_images SET is_featured = false WHERE product_id = $1", [productId]);
    await client.query(
      "UPDATE public.product_images SET is_featured = true WHERE id = $1 AND product_id = $2",
      [imageId, productId]
    );
    await client.query(
      "UPDATE public.products SET image = $1, updated_at = now() WHERE id = $2",
      [image.rows[0].image_url, productId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/");
  revalidatePath(`/produto/${productId}`);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true, message: "Imagem de destaque atualizada." };
}

export async function removeProductImageAction(
  productId: number,
  imageId: number
): Promise<ImageActionResult> {
  await requireAdminUser();
  if (!validateProductId(productId) || !validateProductId(imageId)) {
    return { success: false, message: "Imagem inválida." };
  }

  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const product = await client.query("SELECT id FROM public.products WHERE id = $1 FOR UPDATE", [productId]);
    if (product.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "Produto não encontrado." };
    }

    const target = await client.query<{ is_featured: boolean; public_id: string | null }>(
      "SELECT is_featured, public_id FROM public.product_images WHERE id = $1 AND product_id = $2 FOR UPDATE",
      [imageId, productId]
    );
    if (!target.rows[0]) {
      await client.query("ROLLBACK");
      return { success: false, message: "A imagem já foi removida." };
    }

    const countResult = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.product_images WHERE product_id = $1",
      [productId]
    );
    if (Number(countResult.rows[0]?.count ?? 0) <= 1) {
      await client.query("ROLLBACK");
      return { success: false, message: "Mantenha pelo menos uma imagem no produto." };
    }

    if (target.rows[0].public_id) {
      await destroyCloudinaryAsset(target.rows[0].public_id);
    }

    if (target.rows[0].is_featured) {
      const replacement = await client.query<{ id: number; image_url: string }>(
        `SELECT id, image_url FROM public.product_images
         WHERE product_id = $1 AND id <> $2 ORDER BY sort_order, id LIMIT 1`,
        [productId, imageId]
      );
      if (!replacement.rows[0]) {
        await client.query("ROLLBACK");
        return { success: false, message: "Mantenha pelo menos uma imagem no produto." };
      }
      await client.query("UPDATE public.product_images SET is_featured = false WHERE product_id = $1", [productId]);
      await client.query("UPDATE public.product_images SET is_featured = true WHERE id = $1", [replacement.rows[0].id]);
      await client.query("UPDATE public.products SET image = $1, updated_at = now() WHERE id = $2", [
        replacement.rows[0].image_url,
        productId,
      ]);
    }
    await client.query("DELETE FROM public.product_images WHERE id = $1 AND product_id = $2", [
      imageId,
      productId,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/");
  revalidatePath(`/produto/${productId}`);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true, message: "Imagem removida da galeria." };
}

export async function createAdminUserAction(formData: FormData) {
  await requireAdminRole();
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  const role = value(formData, "role");

  if (!name || name.length > 120 || !validEmail(email) || password.length < 12 || password.length > 128) {
    withError("/admin/users", "Confira o nome, e-mail e senha (mínimo de 12 caracteres).");
  }
  if (role !== "admin" && role !== "editor") {
    withError("/admin/users", "Selecione um perfil válido.");
  }

  try {
    await requirePool().query(
      `INSERT INTO public.admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [name, email, await hashPassword(password), role]
    );
  } catch (error) {
    if (isUniqueViolation(error)) withError("/admin/users", "Já existe uma conta com esse e-mail.");
    throw error;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?notice=Usu%C3%A1rio+cadastrado.");
}

export async function updateAdminUserAction(formData: FormData) {
  const currentUser = await requireAdminRole();
  const id = Number(value(formData, "id"));
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const role = value(formData, "role");
  const password = rawValue(formData, "password");

  if (!Number.isSafeInteger(id) || id < 1 || !name || name.length > 120 || !validEmail(email)) {
    withError("/admin/users", "Revise os dados do usuário.");
  }
  if (role !== "admin" && role !== "editor") {
    withError("/admin/users", "Selecione um perfil válido.");
  }
  if (password && (password.length < 12 || password.length > 128)) {
    withError("/admin/users", "A nova senha deve ter de 12 a 128 caracteres.");
  }
  if (currentUser.id === id && role !== "admin") {
    withError("/admin/users", "Não é possível alterar seu próprio perfil de administrador.");
  }

  const pool = requirePool();
  const client = await pool.connect();
  const passwordHash = password ? await hashPassword(password) : null;
  let userError: string | null = null;
  let duplicateEmail = false;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(294771035)");
    const target = await client.query<{ role: "admin" | "editor"; active: boolean }>(
      "SELECT role, active FROM public.admin_users WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (!target.rows[0]) {
      userError = "Usuário não encontrado.";
    } else if (target.rows[0].active && target.rows[0].role === "admin" && role !== "admin") {
      const admins = await client.query<{ count: string }>(
        "SELECT count(*) FROM public.admin_users WHERE role = 'admin' AND active = true"
      );
      if (Number(admins.rows[0]?.count ?? 0) <= 1) {
        userError = "Mantenha pelo menos um administrador ativo.";
      }
    }

    if (userError) {
      await client.query("ROLLBACK");
    } else {
      await client.query(
        `UPDATE public.admin_users
         SET name = $1, email = $2, role = $3,
             password_hash = COALESCE($4, password_hash), updated_at = now()
         WHERE id = $5`,
        [name, email, role, passwordHash, id]
      );
      if (password) {
        await client.query("DELETE FROM public.admin_sessions WHERE user_id = $1", [id]);
      }
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    if (isUniqueViolation(error)) duplicateEmail = true;
    else throw error;
  } finally {
    client.release();
  }

  if (duplicateEmail) withError("/admin/users", "Já existe uma conta com esse e-mail.");
  if (userError) withError("/admin/users", userError);
  revalidatePath("/admin/users");
  if (currentUser.id === id && password) {
    redirect("/admin/login?notice=Senha+alterada.+Entre+novamente.");
  }
  redirect(currentUser.id === id ? "/admin/users?notice=Sua+conta+foi+atualizada." : "/admin/users?notice=Usu%C3%A1rio+atualizado.");
}

async function changeUserState(formData: FormData, deleting: boolean) {
  const currentUser = await requireAdminRole();
  const id = Number(value(formData, "id"));
  if (!Number.isSafeInteger(id) || id < 1) redirect("/admin/users?error=Usu%C3%A1rio+inv%C3%A1lido.");
  if (currentUser.id === id) withError("/admin/users", "Não é possível desativar ou remover sua própria conta.");

  const pool = requirePool();
  const client = await pool.connect();
  let message = "";
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(294771035)");
    const target = await client.query<{ role: "admin" | "editor"; active: boolean }>(
      "SELECT role, active FROM public.admin_users WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (!target.rows[0]) {
      message = "Usuário não encontrado.";
    } else if (
      target.rows[0].role === "admin" &&
      target.rows[0].active &&
      (deleting || formData.get("active") !== "on")
    ) {
      const admins = await client.query<{ count: string }>(
        "SELECT count(*) FROM public.admin_users WHERE role = 'admin' AND active = true"
      );
      if (Number(admins.rows[0]?.count ?? 0) <= 1) {
        message = "Mantenha pelo menos um administrador ativo.";
      }
    }

    if (!message) {
      if (deleting) {
        await client.query("DELETE FROM public.admin_users WHERE id = $1", [id]);
      } else {
        await client.query(
          "UPDATE public.admin_users SET active = $1, updated_at = now() WHERE id = $2",
          [formData.get("active") === "on", id]
        );
      }
      await client.query("DELETE FROM public.admin_sessions WHERE user_id = $1", [id]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (message) withError("/admin/users", message);
  revalidatePath("/admin/users");
  redirect(deleting ? "/admin/users?notice=Usu%C3%A1rio+removido." : "/admin/users?notice=Status+atualizado.");
}

export async function toggleAdminUserAction(formData: FormData) {
  await changeUserState(formData, false);
}

export async function deleteAdminUserAction(formData: FormData) {
  await changeUserState(formData, true);
}
