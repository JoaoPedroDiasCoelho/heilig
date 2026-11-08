"use client";

import {
  cleanupUnlinkedProductImagesAction,
  createImageUploadSignatureAction,
  saveProductImagesAction,
} from "@/app/admin/actions";

export type UploadedProductImage = {
  publicId: string;
  imageUrl: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export const MAX_PRODUCT_IMAGES = 10;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"]);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function validateProductImageFiles(files: File[], existingCount: number) {
  if (existingCount + files.length > MAX_PRODUCT_IMAGES) {
    return `Cada camisa pode ter até ${MAX_PRODUCT_IMAGES} imagens no total.`;
  }
  const invalidFile = files.find(
    (file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE
  );
  return invalidFile ? "Use arquivos JPG, PNG, WebP ou AVIF de até 10 MB cada." : "";
}

export async function uploadProductImages(
  productId: number,
  files: File[],
  existingCount: number
): Promise<{ success: boolean; hasErrors: boolean; message: string; uploaded: UploadedProductImage[] }> {
  const validationError = validateProductImageFiles(files, existingCount);
  if (validationError) {
    return { success: false, hasErrors: true, message: validationError, uploaded: [] };
  }

  const uploaded: UploadedProductImage[] = [];
  const failures: string[] = [];

  for (const file of files) {
    try {
      const signature = await createImageUploadSignatureAction(productId);
      if (!signature.success) throw new Error(signature.message);

      const body = new FormData();
      body.set("file", file);
      body.set("api_key", signature.apiKey);
      body.set("timestamp", String(signature.timestamp));
      body.set("signature", signature.signature);
      body.set("public_id", signature.publicId);
      body.set("allowed_formats", signature.allowedFormats);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        { method: "POST", body }
      );
      const result = (await response.json()) as CloudinaryUploadResponse;
      if (!response.ok || !result.secure_url || !result.public_id) {
        throw new Error(result.error?.message ?? `Falha no upload de ${file.name}.`);
      }
      uploaded.push({ publicId: result.public_id, imageUrl: result.secure_url });
    } catch (error) {
      failures.push(`${file.name}: ${errorMessage(error)}`);
    }
  }

  if (uploaded.length === 0) {
    return {
      success: false,
      hasErrors: true,
      message: failures.join(" ") || "Nenhuma imagem foi enviada.",
      uploaded,
    };
  }

  try {
    const saved = await saveProductImagesAction(productId, uploaded);
    if (!saved.success) {
      let cleanupMessage = "";
      try {
        const cleanup = await cleanupUnlinkedProductImagesAction(
          productId,
          uploaded.map((image) => image.publicId)
        );
        if (!cleanup.success) cleanupMessage = ` ${cleanup.message}`;
      } catch (error) {
        cleanupMessage = ` Os arquivos enviados não foram salvos e não puderam ser limpos: ${errorMessage(error)}`;
      }
      return {
        success: false,
        hasErrors: true,
        message: `${saved.message}${cleanupMessage}`,
        uploaded: [],
      };
    }

    return {
      success: true,
      hasErrors: failures.length > 0,
      message:
        failures.length > 0
          ? `${saved.message} Alguns arquivos falharam: ${failures.join(" ")}`
          : saved.message,
      uploaded,
    };
  } catch (error) {
    let cleanupMessage = "";
    try {
      const cleanup = await cleanupUnlinkedProductImagesAction(
        productId,
        uploaded.map((image) => image.publicId)
      );
      if (!cleanup.success) cleanupMessage = ` ${cleanup.message}`;
    } catch (cleanupError) {
      cleanupMessage = ` Os arquivos enviados não puderam ser limpos: ${errorMessage(cleanupError)}`;
    }
    return {
      success: false,
      hasErrors: true,
      message: `${errorMessage(error)}${cleanupMessage}`,
      uploaded: [],
    };
  }
}
