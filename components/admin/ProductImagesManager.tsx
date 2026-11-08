"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  removeProductImageAction,
  setFeaturedProductImageAction,
} from "@/app/admin/actions";
import {
  MAX_PRODUCT_IMAGES,
  uploadProductImages,
  validateProductImageFiles,
} from "@/lib/product-image-upload.client";

type ProductImageItem = {
  id: number | null;
  image_url: string;
  public_id: string | null;
  is_featured: boolean;
};

type UploadedAsset = {
  publicId: string;
  imageUrl: string;
};

type ProductImagesManagerProps = {
  productId: number;
  images: ProductImageItem[];
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export default function ProductImagesManager({ productId, images }: ProductImagesManagerProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setUploads([]);
  }, [images]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    const validationError = validateProductImageFiles(selectedFiles, images.length + uploads.length);
    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setBusy(true);
    setMessage(`Enviando ${selectedFiles.length} ${selectedFiles.length === 1 ? "imagem" : "imagens"}...`);
    setIsError(false);
    const result = await uploadProductImages(
      productId,
      selectedFiles,
      images.length + uploads.length
    );
    setIsError(result.hasErrors || !result.success);
    setMessage(result.message);
    if (result.success) {
      setUploads((current) => [...current, ...result.uploaded]);
      router.refresh();
    }

    if (fileInput.current) fileInput.current.value = "";
    setBusy(false);
  }

  async function setFeatured(imageId: number | null) {
    if (imageId === null) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await setFeaturedProductImageAction(productId, imageId);
      setIsError(!result.success);
      setMessage(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(image: ProductImageItem) {
    if (image.id === null) return;
    if (!window.confirm("Remover esta imagem da galeria?")) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await removeProductImageAction(productId, image.id);
      setIsError(!result.success);
      setMessage(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-image-manager" aria-labelledby="product-images-heading">
      <div className="admin-image-manager-heading">
        <div>
          <p className="admin-eyebrow">Fotos do produto</p>
          <h2 id="product-images-heading">Galeria de imagens</h2>
          <p>A imagem destacada aparece na vitrine. As demais ficam no carrossel dos detalhes.</p>
        </div>
        <label className={`admin-button admin-upload-button${busy ? " is-disabled" : ""}`}>
          {busy ? "Aguarde..." : "+ Adicionar imagens"}
          <input
            ref={fileInput}
            type="file"
            accept="image/avif,image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || images.length + uploads.length >= MAX_PRODUCT_IMAGES}
            onChange={(event) => void uploadFiles(event.currentTarget.files)}
          />
        </label>
      </div>
      <p className="admin-image-limit">{images.length} de {MAX_PRODUCT_IMAGES} imagens · JPG, PNG, WebP ou AVIF · até 10 MB cada</p>
      {message && (
        <p className={`admin-alert ${isError ? "admin-alert-error" : "admin-alert-success"}`} role="status">
          {message}
        </p>
      )}
      {images.length === 0 ? (
        <p className="admin-image-empty">Nenhuma foto na galeria ainda. Adicione uma ou mais imagens acima.</p>
      ) : (
        <div className="admin-image-grid">
          {images.map((image) => (
            <article className="admin-image-card" key={image.id ?? image.image_url}>
              <div className="admin-image-preview">
                <Image src={image.image_url} alt="" fill sizes="(max-width: 600px) 45vw, 180px" unoptimized />
              </div>
              {image.is_featured ? (
                <span className="admin-featured-badge">Destaque da loja</span>
              ) : image.id !== null ? (
                <button
                  className="admin-featured-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void setFeatured(image.id)}
                >
                  Definir como destaque
                </button>
              ) : (
                <span className="admin-featured-badge">Imagem principal</span>
              )}
              <button
                className="admin-image-remove"
                type="button"
                aria-label="Remover imagem da galeria"
                disabled={busy || images.length <= 1 || image.id === null}
                title={
                  image.id === null
                    ? "Imagem principal do cadastro"
                    : images.length <= 1
                      ? "O produto precisa manter uma imagem"
                      : "Remover imagem"
                }
                onClick={() => image.id !== null && void removeImage(image)}
              >
                ×
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
