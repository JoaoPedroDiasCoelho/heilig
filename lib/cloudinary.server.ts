import "server-only";

import { createHash } from "node:crypto";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function getConfig(): CloudinaryConfig {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } =
    process.env;
  if (!cloudName || !/^[a-zA-Z0-9-]+$/.test(cloudName) || !apiKey || !apiSecret) {
    throw new Error(
      "Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET nas variáveis do ambiente."
    );
  }
  return { cloudName, apiKey, apiSecret };
}

export function getCloudinarySignature(publicId: string) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParameters = [
    `allowed_formats=avif,jpg,jpeg,png,webp`,
    `public_id=${publicId}`,
    `timestamp=${timestamp}`,
  ].join("&");
  const signature = createHash("sha1")
    .update(`${signedParameters}${config.apiSecret}`)
    .digest("hex");

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    signature,
    publicId,
    allowedFormats: "avif,jpg,jpeg,png,webp",
  };
}

export function isValidCloudinaryAsset(productId: number, imageUrl: string, publicId: string) {
  const { cloudName } = getConfig();
  if (!new RegExp(`^heilig/products/${productId}/[a-f0-9-]{36}$`).test(publicId)) return false;

  try {
    const url = new URL(imageUrl);
    const assetPath = `/heilig/products/${productId}/${publicId.split("/").at(-1)}.`;
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
      url.pathname.includes(assetPath) &&
      /\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function destroyCloudinaryAsset(publicId: string) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");
  const body = new FormData();
  body.set("public_id", publicId);
  body.set("api_key", config.apiKey);
  body.set("timestamp", String(timestamp));
  body.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    { method: "POST", body, cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`Cloudinary image deletion failed with status ${response.status}.`);
  }

  const result = (await response.json()) as { result?: string; error?: { message?: string } };
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(result.error?.message ?? "Cloudinary could not delete the image.");
  }
}
