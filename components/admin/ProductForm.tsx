"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SIZES, type Product, type ProductCategory } from "@/lib/products";
import { createProductAction, updateProductAction } from "@/app/admin/actions";
import {
  MAX_PRODUCT_IMAGES,
  uploadProductImages,
  validateProductImageFiles,
} from "@/lib/product-image-upload.client";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProductFormProps = {
  product?: Product & { active: boolean; sort_order: number };
  error?: string;
};

export default function ProductForm({ product, error }: ProductFormProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState(error ?? "");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [priceCents, setPriceCents] = useState(
    product ? String(Math.round(product.price * 100)) : ""
  );

  useEffect(() => {
    const urls = selectedImages.map((file) => URL.createObjectURL(file));
    setImageUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedImages]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const existingImageCount = String(formData.get("image") ?? "").trim() ? 1 : 0;
    const validationError = validateProductImageFiles(selectedImages, existingImageCount);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const created = await createProductAction(formData);
      if (!created.success) {
        setFormError(created.message);
        return;
      }

      const params = new URLSearchParams({ notice: "Camisa cadastrada." });
      if (selectedImages.length > 0) {
        const orderedImages = selectedImages.map(
          (_, index) => selectedImages[(featuredImageIndex + index) % selectedImages.length]
        );
        const upload = await uploadProductImages(
          created.productId,
          orderedImages,
          existingImageCount
        );
        if (upload.hasErrors || !upload.success) params.set("error", upload.message);
        else params.set("notice", "Camisa cadastrada e imagens adicionadas à galeria.");
      }
      router.push(`/admin/products?${params.toString()}`);
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error ? caughtError.message : "Não foi possível cadastrar a camisa."
      );
    } finally {
      setSaving(false);
    }
  }

  function addImages(files: FileList | null) {
    if (!files?.length) return;
    const nextImages = [...selectedImages, ...Array.from(files)];
    const validationError = validateProductImageFiles(nextImages, imageUrl.trim() ? 1 : 0);
    if (validationError) setFormError(validationError);
    else {
      setSelectedImages(nextImages);
      setFeaturedImageIndex(selectedImages.length ? featuredImageIndex : 0);
      setFormError("");
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeImage(index: number) {
    setSelectedImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setFeaturedImageIndex((current) => {
      if (current === index) return 0;
      return current > index ? current - 1 : current;
    });
  }

  return (
    <form
      className="admin-form admin-product-form"
      action={product ? updateProductAction : undefined}
      onSubmit={product ? undefined : createProduct}
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      {formError && <p className="admin-alert admin-alert-error" role="alert">{formError}</p>}
      <label>
        Nome da camisa
        <input name="name" required maxLength={120} defaultValue={product?.name ?? ""} />
      </label>
      <div className="admin-form-row">
        <label>
          Preço (R$)
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            value={priceCents ? priceFormatter.format(Number(priceCents) / 100) : ""}
            onChange={(event) => {
              const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 10);
              setPriceCents(digits);
              setFormError("");
            }}
            aria-label="Preço em reais"
          />
          <input
            type="hidden"
            name="price"
            value={
              priceCents
                ? `${Math.floor(Number(priceCents) / 100)}.${(Number(priceCents) % 100)
                    .toString()
                    .padStart(2, "0")}`
                : ""
            }
          />
        </label>
        <label>
          Cor
          <input name="color" required maxLength={80} defaultValue={product?.color ?? ""} />
        </label>
      </div>
      <label>
        Tipo de produto
        <select name="category" defaultValue={product?.category ?? "camisa"}>
          {([
            ["camisa", "Camisa"],
            ["bone", "Boné"],
            ["moletom", "Moletom"],
          ] satisfies [ProductCategory, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <section className="admin-stock-manager" aria-labelledby="admin-stock-heading">
        <div>
          <p className="admin-eyebrow">Disponibilidade</p>
          <h2 id="admin-stock-heading">Estoque por tamanho</h2>
          <p>Informe quantas unidades estão disponíveis em cada tamanho.</p>
        </div>
        <div className="admin-stock-grid">
          {SIZES.map((size) => (
            <label key={size}>
              {size}
              <input
                name={`stock_${size}`}
                type="number"
                min="0"
                max="1000000"
                step="1"
                required
                defaultValue={product?.stock[size] ?? 0}
                aria-label={`Unidades disponíveis no tamanho ${size}`}
              />
            </label>
          ))}
        </div>
      </section>
      {!product ? (
        <>
          <section className="admin-image-manager admin-product-image-picker" aria-labelledby="new-product-images-heading">
            <div className="admin-image-manager-heading">
              <div>
                <p className="admin-eyebrow">Fotos do produto</p>
                <h2 id="new-product-images-heading">Galeria de imagens</h2>
                <p>A imagem destacada aparece na vitrine. As demais ficam no carrossel dos detalhes.</p>
              </div>
              <label className="admin-button admin-upload-button">
                + Adicionar imagens
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/avif,image/jpeg,image/png,image/webp"
                  multiple
                  disabled={selectedImages.length + (imageUrl.trim() ? 1 : 0) >= MAX_PRODUCT_IMAGES}
                  onChange={(event) => addImages(event.currentTarget.files)}
                />
              </label>
            </div>
            <p className="admin-image-limit">
              {selectedImages.length + (imageUrl.trim() ? 1 : 0)} de {MAX_PRODUCT_IMAGES} imagens · JPG, PNG, WebP ou AVIF · até 10 MB cada
            </p>
            {selectedImages.length === 0 ? (
              <button
                className="admin-product-image-empty"
                type="button"
                onClick={() => fileInput.current?.click()}
              >
                <span aria-hidden="true">＋</span>
                <strong>Adicione as fotos da camisa</strong>
                <small>Você pode selecionar várias imagens de uma vez.</small>
              </button>
            ) : (
              <div className="admin-image-grid">
                {selectedImages.map((file, index) => (
                  <article className="admin-image-card" key={`${file.name}-${file.lastModified}-${index}`}>
                    <div className="admin-image-preview">
                      {/* Local preview of the selected file before it is uploaded. */}
                      <img src={imageUrls[index]} alt={`Prévia de ${file.name}`} />
                      <button
                        className="admin-image-remove"
                        type="button"
                        aria-label={`Remover ${file.name}`}
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                    {imageUrl.trim() ? (
                      <span className="admin-featured-button">Foto da galeria</span>
                    ) : featuredImageIndex === index ? (
                      <span className="admin-featured-badge">Destaque da loja</span>
                    ) : (
                      <button
                        className="admin-featured-button"
                        type="button"
                        onClick={() => setFeaturedImageIndex(index)}
                      >
                        Definir como destaque
                      </button>
                    )}
                    <span className="admin-product-image-name" title={file.name}>{file.name}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
          <label>
            Imagem inicial (URL)
            <input
              name="image"
              type="text"
              maxLength={2048}
              placeholder="Opcional: /products/camisa.jpg ou https://..."
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.currentTarget.value);
                setFormError("");
              }}
            />
            <small>
              Opcional. Se informar uma URL, ela será a imagem de destaque; caso contrário, a foto
              marcada acima será usada.
            </small>
          </label>
        </>
      ) : (
        <p className="admin-form-note">Para alterar a imagem da vitrine ou adicionar fotos, use a galeria abaixo.</p>
      )}
      <div className="admin-form-row">
        <label>
          Ordem na vitrine
          <input name="sort_order" type="number" min="0" max="1000000" step="1" defaultValue={product?.sort_order ?? 0} />
        </label>
        <div className="admin-form-switches">
          <label className="admin-checkbox">
            <input name="active" type="checkbox" defaultChecked={product?.active ?? true} />
            Ativo na página de produtos
          </label>
          <label className="admin-checkbox">
            <input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} />
            Exibir como destaque na home
          </label>
        </div>
      </div>
      <div className="admin-form-actions">
        <button className="admin-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : product ? "Salvar alterações" : "Cadastrar camisa"}
        </button>
      </div>
    </form>
  );
}
